#!/usr/bin/env python3
"""Mock of a B2B client's own backend, for the CDC-lookalike backup demo (OR-453).

Stands in for the small server a client (e.g. Crypto.com) runs in front of Mesh.
It exposes exactly the three things the demo needs and nothing else:

    POST /linktoken            -> mint a Mesh link token (the NORMAL deposit path),
                                  and, on demand, FAIL to simulate a Mesh outage
    POST /backup/token         -> mint a short-lived, user-scoped bearer token for JIT
    POST /backup/jit/initiate  -> begin backup deposit-address resolution   (Bearer)
    GET  /backup/jit/status    -> poll until the address is `ready`          (Bearer)

This is the *client-direct* JIT contract (OR-452): the backup widget calls these
endpoints itself, presenting the short-lived token as `Authorization: Bearer …`.
That is deliberately different from the Mesh-facing, mutual-HMAC JIT mock in
FrontBackEnd (`scripts/jit-local-mock/`) which this is ported from — there Mesh
calls the client; here the client's own widget calls the client. The request
mirrors `ManagedJitAddressRequest` + `userId`; the response mirrors
`ManagedJitAddressResponse` ("ready" | "pending" | "error", HTTP 200 for every
expected outcome).

Standard library only — no pip install, and no new runtime (the SDK repo already
uses python3 for tooling). See README.md for setup and the demo walkthrough.

    python3 mock_client_backend.py [port]        # default 4600
"""

import json
import os
import secrets
import sys
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import Lock
from urllib.parse import parse_qs, urlparse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 4600

# --- Normal path (POST /linktoken) ------------------------------------------
# To make the NORMAL deposit actually load Mesh's widget you need a real link
# token. Two ways, in priority order:
#   1. Proxy: set MESH_API_BASE + MESH_CLIENT_ID + MESH_CLIENT_SECRET and this
#      server mints one from Mesh on each request (recommended for a live demo).
#   2. Paste: set DEMO_LINK_TOKEN to a token you already minted by hand.
# With neither, /linktoken returns `configured: false` and the app shows a hint.
# The BACKUP path needs none of this — that is the whole point of the demo.
MESH_API_BASE = os.environ.get("MESH_API_BASE", "").rstrip("/")
MESH_CLIENT_ID = os.environ.get("MESH_CLIENT_ID", "")
MESH_CLIENT_SECRET = os.environ.get("MESH_CLIENT_SECRET", "")
DEMO_LINK_TOKEN = os.environ.get("DEMO_LINK_TOKEN", "")

# --- Backup token minting ---------------------------------------------------
# Short-lived, user-scoped bearer for the client-direct JIT calls. OR-452 caps
# this at 10 min; we default to 10 and clamp so a stray env can't exceed it.
BACKUP_TOKEN_TTL_S = min(int(os.environ.get("BACKUP_TOKEN_TTL_S", "600")), 600)

# --- Backup JIT behaviour (mirrors scripts/jit-local-mock) ------------------
# ready   — resolve (after any delay below) to a real-looking address
# pending — never resolves, so the widget hits its own deadline (fail-closed)
# error   — terminal, non-retryable failure
JIT_MODE = os.environ.get("JIT_MODE", "ready")
# Answer `pending` for this long (per user+network+symbol) before `ready`, so the
# widget's loading screen is actually visible. Default 0 resolves inline.
JIT_DELAY_S = float(os.environ.get("JIT_DELAY_MS", "0")) / 1000.0

# Per-network demo addresses. Keyed by Mesh networkId so each chain gets a
# correctly-formatted address (an ETH-format address on Tron would be rejected
# by the widget's format check). These are for showing the QR/copy screen only.
# ⚠️ DEMO ADDRESSES — never send real funds to them.
DEMO_ADDRESSES = {
    # USDC · Ethereum
    "e3c7fdd8-b1fc-4e51-85ae-bb276e075611": {
        "address": "0x503828976D22510aad0201ac7EC88293211D23Da",
        "addressTag": None,
    },
    # USDC · Tron
    "c5dc5d2e-68c1-4261-9a30-90b598738bf5": {
        "address": "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9",
        "addressTag": None,
    },
}
# token -> (userId, expires_at_epoch_s)
_tokens: dict[str, tuple[str, float]] = {}
# (userId, networkId, symbol) -> monotonic time first seen, for JIT_DELAY_S
_first_seen: dict[tuple, float] = {}
_lock = Lock()


def _log(msg: str) -> None:
    print(f"[mock-backend] {msg}", flush=True)


def _mint_backup_token(user_id: str) -> dict:
    token = "cdcdemo_" + secrets.token_urlsafe(24)
    with _lock:
        _tokens[token] = (user_id, time.time() + BACKUP_TOKEN_TTL_S)
    return {"token": token, "userId": user_id, "expiresInSeconds": BACKUP_TOKEN_TTL_S}


def _resolve_bearer(headers, user_id: str) -> tuple[bool, str]:
    """Fail-closed check of the Authorization bearer. Returns (ok, reason)."""
    raw = headers.get("Authorization") or headers.get("authorization") or ""
    if not raw.lower().startswith("bearer "):
        return False, "missing bearer token"
    token = raw[7:].strip()
    with _lock:
        entry = _tokens.get(token)
    if entry is None:
        return False, "unknown token"
    tok_user, expires_at = entry
    if time.time() > expires_at:
        return False, "token expired"
    # Token is user-scoped (OR-452): it may only resolve addresses for its own
    # user, and a request that omits userId is rejected rather than resolved —
    # fail-closed, since the real contract keys addresses per user.
    if not user_id or tok_user != user_id:
        return False, "token/user mismatch"
    return True, ""


def _mint_link_token(body: dict) -> tuple[int, dict]:
    """The normal deposit path. Returns (status_code, response_body)."""
    if body.get("simulateOutage"):
        # The breakable half: pretend the primary Mesh API is down. The app
        # treats a 5xx here as an outage and falls back to the backup widget.
        _log("POST /linktoken -> 503 (simulated Mesh outage)")
        return 503, {
            "error": "primary_unavailable",
            "message": "Simulated Mesh API outage — fall back to the backup deposit flow.",
        }

    if MESH_API_BASE and MESH_CLIENT_ID and MESH_CLIENT_SECRET:
        try:
            token = _proxy_mesh_link_token(body)
            _log("POST /linktoken -> 200 (proxied real Mesh token)")
            return 200, {"configured": True, "content": {"linkToken": token}}
        except Exception as exc:  # noqa: BLE001 - demo surfaces any proxy failure
            _log(f"POST /linktoken -> 502 (Mesh proxy failed: {exc})")
            return 502, {"error": "mesh_proxy_failed", "message": str(exc)}

    if DEMO_LINK_TOKEN:
        _log("POST /linktoken -> 200 (DEMO_LINK_TOKEN)")
        return 200, {"configured": True, "content": {"linkToken": DEMO_LINK_TOKEN}}

    _log("POST /linktoken -> 200 (unconfigured: no Mesh creds, no DEMO_LINK_TOKEN)")
    return 200, {
        "configured": False,
        "content": {"linkToken": ""},
        "message": (
            "Normal path needs a Mesh link token. Set MESH_API_BASE/MESH_CLIENT_ID/"
            "MESH_CLIENT_SECRET to proxy one, or DEMO_LINK_TOKEN to paste one. The "
            "backup deposit flow needs neither."
        ),
    }


def _proxy_mesh_link_token(body: dict) -> str:
    """Mint a real link token from Mesh, mirroring a client's own backend.

    Forwards the app's request body verbatim, so it only succeeds if that body is
    a valid Mesh link-token request for your integration (the example sends a
    minimal one). If Mesh rejects it the proxy raises and /linktoken returns 502;
    `DEMO_LINK_TOKEN` is the zero-config alternative. Extend the app's body (see
    cdc/backend.ts) to match your own link-token integration.
    """
    payload = json.dumps(body).encode()
    req = urllib.request.Request(
        f"{MESH_API_BASE}/api/v1/linktoken",
        data=payload,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-Client-Id": MESH_CLIENT_ID,
            "X-Client-Secret": MESH_CLIENT_SECRET,
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.loads(resp.read() or b"{}")
    token = ((data or {}).get("content") or {}).get("linkToken")
    if not token:
        raise ValueError(f"Mesh returned no linkToken: {json.dumps(data)[:200]}")
    return token


def _jit_response(ctx: dict) -> dict:
    """ManagedJitAddressResponse-shaped body for the client-direct JIT contract.

    The canonical Mesh shape is {status, address?, addressTag?, retryable?}. We
    also echo {userId, networkId, symbol} so a widget doing echo-validation
    (OR-452, "client-side echo + format validation") can confirm the response
    matches its request. Extra fields are harmless to a widget that ignores them.
    """
    network_id = ctx.get("networkId")
    symbol = ctx.get("symbol")
    user_id = ctx.get("userId")

    if JIT_MODE == "pending":
        return {"status": "pending", "userId": user_id, "networkId": network_id, "symbol": symbol}
    if JIT_MODE == "error":
        return {
            "status": "error",
            "retryable": False,
            "userId": user_id,
            "networkId": network_id,
            "symbol": symbol,
        }

    if JIT_DELAY_S > 0:
        key = (user_id, network_id, symbol)
        with _lock:
            started = _first_seen.setdefault(key, time.monotonic())
        if time.monotonic() - started < JIT_DELAY_S:
            return {"status": "pending", "userId": user_id, "networkId": network_id, "symbol": symbol}

    addr = DEMO_ADDRESSES.get(network_id)
    if addr is None:
        # Fail closed: handing back a plausible-but-wrong-format address for an
        # unknown network is exactly the money-flow bug this stand-in must not
        # model. An unknown pair is a terminal error, not a resolved address.
        return {
            "status": "error",
            "retryable": False,
            "userId": user_id,
            "networkId": network_id,
            "symbol": symbol,
        }
    return {
        "status": "ready",
        "address": addr["address"],
        "addressTag": addr["addressTag"],
        "userId": user_id,
        "networkId": network_id,
        "symbol": symbol,
    }


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    # --- helpers ------------------------------------------------------------
    def _cors_headers(self) -> None:
        # The backup widget runs on a different origin and calls these endpoints
        # from the browser, so CORS must be open. A real client locks this down
        # to the widget origin; a local demo mock allows any.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "authorization, content-type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _send(self, code: int, obj: dict) -> None:
        self.send_response(code)
        # A 204 (CORS preflight) must not carry a body: under HTTP/1.1 keep-alive
        # a stray body would desync the connection and offset the next response.
        if code == 204:
            self.send_header("Content-Length", "0")
            self._cors_headers()
            self.end_headers()
            return
        body = json.dumps(obj).encode()
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        try:
            return json.loads(raw or b"{}")
        except json.JSONDecodeError:
            return {}

    # --- routes -------------------------------------------------------------
    def do_OPTIONS(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        self._send(204, {})

    def do_GET(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        path = urlparse(self.path).path
        if path == "/healthz":
            return self._send(200, {"status": "ok"})
        if path == "/backup/jit/status":
            q = parse_qs(urlparse(self.path).query)
            ctx = {k: q.get(k, [None])[0] for k in ("userId", "networkId", "symbol")}
            ok, reason = _resolve_bearer(self.headers, ctx.get("userId"))
            if not ok:
                _log(f"GET /backup/jit/status -> 401 ({reason})")
                return self._send(401, {"error": "unauthorized", "message": reason})
            _log(f"GET /backup/jit/status mode={JIT_MODE} {json.dumps(ctx)}")
            return self._send(200, _jit_response(ctx))
        return self._send(404, {"error": "not_found", "path": path})

    def do_POST(self) -> None:  # noqa: N802 - BaseHTTPRequestHandler API
        path = urlparse(self.path).path
        body = self._read_json()

        if path == "/linktoken":
            code, resp = _mint_link_token(body)
            return self._send(code, resp)

        if path == "/backup/token":
            user_id = body.get("userId")
            if not user_id:
                return self._send(400, {"error": "missing_userId"})
            _log(f"POST /backup/token -> minted (userId={user_id}, ttl={BACKUP_TOKEN_TTL_S}s)")
            return self._send(200, _mint_backup_token(user_id))

        if path == "/backup/jit/initiate":
            ctx = {k: body.get(k) for k in ("userId", "networkId", "symbol")}
            ok, reason = _resolve_bearer(self.headers, ctx.get("userId"))
            if not ok:
                _log(f"POST /backup/jit/initiate -> 401 ({reason})")
                return self._send(401, {"error": "unauthorized", "message": reason})
            _log(f"POST /backup/jit/initiate mode={JIT_MODE} {json.dumps(ctx)}")
            return self._send(200, _jit_response(ctx))

        return self._send(404, {"error": "not_found", "path": path})

    def log_message(self, *_args) -> None:
        """Silence the default per-request stderr noise; routes log what matters."""


if __name__ == "__main__":
    mode = "proxy" if (MESH_API_BASE and MESH_CLIENT_ID) else ("paste" if DEMO_LINK_TOKEN else "unconfigured")
    _log(f"listening on http://0.0.0.0:{PORT}")
    _log(f"normal /linktoken: {mode}   backup JIT mode: {JIT_MODE}   token TTL: {BACKUP_TOKEN_TTL_S}s")
    # Bind 0.0.0.0 so an emulator / real device / tunnel can reach it, not just
    # this machine's loopback.
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
