import type { MeshLinkEnvironment } from './types';
export declare const DARK_THEME_COLOR_TOP = "#1E1E24";
export declare const LIGHT_THEME_COLOR_TOP = "#F3F4F5";
export declare const DARK_THEME_COLOR_BOTTOM = "#0E0D0D";
export declare const LIGHT_THEME_COLOR_BOTTOM = "#FBFBFB";
export declare const WHITELISTED_ORIGINS: string[];
export declare const EXTERNALLY_OPENED_ORIGINS: string[];
/** Link host per environment, used only by `sessionLinkToken`. A link token
 *  already carries its own host, so the legacy path never consults this.
 *
 *  Compiled into the SDK, so a host change needs a new release and integrators
 *  updating. If that becomes a problem, resolve these from remote config. */
export declare const LINK_URLS: Record<MeshLinkEnvironment, string>;
