import { createHash } from 'crypto';
import { OFFLINE_WIDGET_HTML, getBundledOfflineWidget } from '../backup-bundle';

describe('Tier-2 backup bundle', () => {
  it('exposes the self-contained offline widget HTML', () => {
    const { html } = getBundledOfflineWidget();
    expect(html).toBe(OFFLINE_WIDGET_HTML);
    expect(html.toLowerCase()).toContain('<!doctype html>');
  });

  it('is self-contained — no external http(s) asset references', () => {
    // The catalog snapshot + top-N logos are inlined at the widget's build time,
    // so Tier 2 makes no Mesh-owned network call. Guards against a regression that
    // reintroduces a remote script/style/logo URL.
    expect(OFFLINE_WIDGET_HTML).not.toMatch(/(src|href)\s*=\s*["']https?:/i);
  });

  it('declares the sha256 of every inline script/style in its CSP (no stale hashes)', () => {
    // The widget's CSP allows inline code only by hash. If one byte of the inline
    // script/style changes without the hash being regenerated, the WebView blocks
    // it and the offline fallback renders blank — so check the hashes really match.
    const csp = OFFLINE_WIDGET_HTML.match(
      /<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])([\s\S]*?)\2/i
    )?.[3];
    expect(csp).toBeDefined();
    const sources = (directive: string) =>
      new Set(
        (csp ?? '')
          .split(';')
          .map((d) => d.trim().split(/\s+/))
          .find(([name]) => name === directive)
          ?.slice(1) ?? []
      );
    const sha256 = (body: string) =>
      `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;

    for (const [directive, pattern] of [
      ['script-src', /<script\b[^>]*>([\s\S]*?)<\/script>/gi],
      ['style-src', /<style\b[^>]*>([\s\S]*?)<\/style>/gi],
    ] as const) {
      const bodies = [...OFFLINE_WIDGET_HTML.matchAll(pattern)].map((m) => m[1]);
      expect(bodies.length).toBeGreaterThan(0);
      for (const body of bodies) {
        expect(sources(directive)).toContain(sha256(body));
      }
    }
    // Hash-only: no 'unsafe-inline' escape hatch.
    expect(csp).not.toMatch(/'unsafe-inline'/);
  });

  it('speaks the SDK message bridge the host drives (loaded handshake + config)', () => {
    // The widget posts to the native bridge and consumes the meshBackupConfig
    // envelope the SDK delivers — the same contract as Tier 1.
    expect(OFFLINE_WIDGET_HTML).toContain('ReactNativeWebView');
    expect(OFFLINE_WIDGET_HTML).toContain('meshBackupConfig');
  });
});
