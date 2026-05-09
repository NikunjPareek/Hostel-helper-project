function parseCookies(header = '') {
    return header.split(';').reduce((cookies, part) => {
        const index = part.indexOf('=');
        if (index === -1) return cookies;

        const key = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (!key) return cookies;

        try {
            cookies[key] = decodeURIComponent(value);
        } catch (_) {
            cookies[key] = value;
        }
        return cookies;
    }, {});
}

module.exports = { parseCookies };
