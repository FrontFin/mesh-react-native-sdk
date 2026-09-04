const keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
export const decode64 = (input) => {
    let output = '';
    let chr1, chr2, chr3 = '';
    let enc1, enc2, enc3, enc4 = '';
    let ind = 0;
    // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
    const base64test = /[^A-Za-z0-9+/=]/g;
    if (base64test.exec(input)) {
        throw new Error(`There were invalid base64 characters in the input text. Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='`);
    }
    input = input.replace(/[^A-Za-z0-9+/=]/g, '');
    do {
        enc1 = keyStr.indexOf(input.charAt(ind++));
        enc2 = keyStr.indexOf(input.charAt(ind++));
        enc3 = keyStr.indexOf(input.charAt(ind++));
        enc4 = keyStr.indexOf(input.charAt(ind++));
        chr1 = (enc1 << 2) | (enc2 >> 4);
        chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        chr3 = ((enc3 & 3) << 6) | enc4;
        output = output + String.fromCharCode(chr1);
        if (enc3 != 64) {
            output = output + String.fromCharCode(chr2);
        }
        if (enc4 != 64) {
            output = output + String.fromCharCode(chr3);
        }
    } while (ind < input.length);
    return output;
};
/**
 * Counterpart to [decode64]. Hand-rolled for the same reason: Hermes does not
 * reliably provide `btoa`.
 *
 * ASCII only, which is all the callers need (a Link URL is an ASCII host plus a
 * base64url token). Throws rather than silently mangling anything wider.
 */
export const encode64 = (input) => {
    let output = '';
    let ind = 0;
    do {
        const chr1 = input.charCodeAt(ind++);
        const chr2 = input.charCodeAt(ind++);
        const chr3 = input.charCodeAt(ind++);
        if (chr1 > 127 || chr2 > 127 || chr3 > 127) {
            throw new Error('encode64 supports ASCII input only');
        }
        const enc1 = chr1 >> 2;
        const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
        let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
        let enc4 = chr3 & 63;
        if (isNaN(chr2)) {
            enc3 = enc4 = 64;
        }
        else if (isNaN(chr3)) {
            enc4 = 64;
        }
        output =
            output +
                keyStr.charAt(enc1) +
                keyStr.charAt(enc2) +
                keyStr.charAt(enc3) +
                keyStr.charAt(enc4);
    } while (ind < input.length);
    return output;
};
