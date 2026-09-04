export declare const decode64: (input: string) => string;
/**
 * Counterpart to [decode64]. Hand-rolled for the same reason: Hermes does not
 * reliably provide `btoa`.
 *
 * ASCII only, which is all the callers need (a Link URL is an ASCII host plus a
 * base64url token). Throws rather than silently mangling anything wider.
 */
export declare const encode64: (input: string) => string;
