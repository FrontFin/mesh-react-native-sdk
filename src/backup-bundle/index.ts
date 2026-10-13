import { OFFLINE_WIDGET_HTML } from './generated';

export { OFFLINE_WIDGET_HTML };

/**
 * The Tier-2 widget HTML with the host theme applied. Tier 2 loads from an inline
 * string, so unlike Tier 1 there is no URL to carry `?theme=`; without this the
 * widget falls back to `prefers-color-scheme`, which follows the APP's appearance
 * and ignores an explicit `settings.theme`. The widget's CSS honours
 * `:root[data-theme]`, and an attribute on `<html>` is outside every CSP hash.
 * If the root tag isn't found the HTML is returned unchanged (theme then follows
 * `prefers-color-scheme`) — never a broken document.
 */
export function withWidgetTheme(html: string, theme: 'dark' | 'light'): string {
  return html.replace(/<html(?=[\s>])/i, `<html data-theme="${theme}"`);
}

/** The bundled Tier-2 asset: the self-contained offline widget HTML. */
export interface BundledOfflineWidget {
  /**
   * Self-contained widget HTML to load via WebView `source={{ html }}`. The
   * catalog snapshot + top-N logos are already inlined in it (design §5H), so
   * the SDK loads nothing else for Tier 2 and makes no Mesh-owned network call.
   */
  html: string;
}

/**
 * Returns the Tier-2 bundle embedded in this SDK build. Used by
 * `LinkConnectBackup` when the Tier-1 backup origin is unreachable, so a deposit
 * can render with zero Mesh-owned network dependency (design §5H).
 */
export function getBundledOfflineWidget(): BundledOfflineWidget {
  return { html: OFFLINE_WIDGET_HTML };
}
