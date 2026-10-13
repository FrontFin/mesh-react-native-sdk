import { createHash } from 'crypto';
import {
  OFFLINE_WIDGET_HTML,
  getBundledOfflineWidget,
  withWidgetTheme,
} from '../backup-bundle';

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

  it('enforces the exact hash-only, no-network CSP (no stale or extra sources)', () => {
    // The widget's CSP allows inline code only by hash and blocks all network
    // access. If one byte of the inline script/style changes without the hash being
    // regenerated, the WebView blocks it and the offline fallback renders blank; if
    // a source like `https:` creeps in, the no-network guarantee is gone. So pin the
    // hash sets EXACTLY to the actual inline code, and every other directive.
    const csp = OFFLINE_WIDGET_HTML.match(
      /<meta\s+http-equiv=(["'])Content-Security-Policy\1\s+content=(["'])([\s\S]*?)\2/i
    )?.[3];
    expect(csp).toBeDefined();
    const directives = new Map<string, string[]>();
    for (const part of (csp ?? '').split(';')) {
      const [name, ...srcs] = part.trim().split(/\s+/).filter(Boolean);
      if (!name) continue;
      // A duplicated directive is ignored by browsers after the first — reject it.
      expect(directives.has(name.toLowerCase())).toBe(false);
      directives.set(name.toLowerCase(), srcs);
    }
    const sha256 = (body: string) =>
      `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`;
    const inlineHashes = (pattern: RegExp) =>
      [...new Set([...OFFLINE_WIDGET_HTML.matchAll(pattern)].map((m) => sha256(m[1])))].sort();

    const scriptHashes = inlineHashes(/<script\b[^>]*>([\s\S]*?)<\/script>/gi);
    const styleHashes = inlineHashes(/<style\b[^>]*>([\s\S]*?)<\/style>/gi);
    expect(scriptHashes.length).toBeGreaterThan(0);
    expect(styleHashes.length).toBeGreaterThan(0);

    // Exactly the allowlisted directives, each with exactly the expected sources.
    expect(Object.fromEntries([...directives].map(([k, v]) => [k, [...v].sort()]))).toEqual({
      'default-src': ["'none'"],
      'script-src': scriptHashes,
      'style-src': styleHashes,
      'img-src': ['data:'],
      'connect-src': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'none'"],
    });
  });

  it('speaks the SDK message bridge the host drives (loaded handshake + config)', () => {
    // The widget posts to the native bridge and consumes the meshBackupConfig
    // envelope the SDK delivers — the same contract as Tier 1.
    expect(OFFLINE_WIDGET_HTML).toContain('ReactNativeWebView');
    expect(OFFLINE_WIDGET_HTML).toContain('meshBackupConfig');
  });

  it.each([['dark'], ['light']] as const)(
    'withWidgetTheme stamps data-theme="%s" on the root tag only',
    (theme) => {
      const html = withWidgetTheme(OFFLINE_WIDGET_HTML, theme);
      expect(html).toContain(`<html data-theme="${theme}" lang="en">`);
      // Everything else — including every CSP-hashed inline script/style — is
      // byte-identical, so the hash-only CSP still admits it.
      expect(html.replace(` data-theme="${theme}"`, '')).toBe(OFFLINE_WIDGET_HTML);
    }
  );

  it('withWidgetTheme leaves HTML without a root tag unchanged', () => {
    expect(withWidgetTheme('<body>x</body>', 'dark')).toBe('<body>x</body>');
    // <head> / <header> must not be mistaken for <html>.
    expect(withWidgetTheme('<htmlx><header>', 'dark')).toBe('<htmlx><header>');
  });
});
