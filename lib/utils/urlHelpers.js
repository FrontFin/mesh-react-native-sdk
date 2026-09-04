import queryString from 'query-string';
export const urlSearchParams = (url) => {
    if (!url)
        return {};
    const query = queryString.parseUrl(url).query;
    const params = {};
    for (const [key, value] of Object.entries(query)) {
        if (typeof value === 'string') {
            params[key] = value;
        }
    }
    return params;
};
export const addURLParam = (url, param, value) => {
    if (!param.length) {
        return url;
    }
    if (!value.length) {
        return `${url}${url.includes('?') ? '&' : '?'}${param}`;
    }
    return `${url}${url.includes('?') ? '&' : '?'}${param}=${value}`;
};
