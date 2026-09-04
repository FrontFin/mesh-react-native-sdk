export const isValidUrl = (urlStr) => {
    if (typeof urlStr !== 'string' || !urlStr.length) {
        return false;
    }
    return urlStr.startsWith('https://') || urlStr.startsWith('http://');
};
