export class Ajax {
    constructor(options = {}) {
        const defaultOptions = {
            baseURL: '',
            timeout: 5000,
            headers: {},
            fetchOptions: {},
        };
        this.options = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {}),
            },
            fetchOptions: {
                ...defaultOptions.fetchOptions,
                ...(options.fetchOptions || {}),
            },
        };
    }

    async get(url, options = {}) {
        return this._request('GET', url, undefined, options);
    }

    async post(url, data, options = {}) {
        return this._request('POST', url, data, options);
    }

    async put(url, data, options = {}) {
        return this._request('PUT', url, data, options);
    }

    async delete(url, options = {}) {
        return this._request('DELETE', url, undefined, options);
    }

    _buildURL(url, baseURL) {
        if (/^https?:\/\//i.test(url)) return url;

        if (!baseURL) return url;

        return `${baseURL.replace(/\/+$/, '')}/${url.replace(/^\/+/, '')}`;
    }

    _mergeOptions(localOptions = {}) {
        const global = this.options;

        const timeout = localOptions.timeout ?? global.timeout;

        const headers = {
            ...global.headers,
            ...(localOptions.headers || {}),
        };

        const fetchOptions = {
            ...global.fetchOptions,
            ...(localOptions.fetchOptions || {}),
        };

        const baseURL = localOptions.baseURL ?? global.baseURL;

        return { timeout, headers, fetchOptions, baseURL };
    }

    async _request(method, url, data, localOptions = {}) {
        const { timeout, headers, fetchOptions, baseURL } =
            this._mergeOptions(localOptions);

        const finalURL = this._buildURL(url, baseURL);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const finalHeaders = { ...headers };

        const options = {
            method,
            signal: controller.signal,
            ...fetchOptions,
            headers: finalHeaders,
        };

        if (data !== undefined) {
            options.body = JSON.stringify(data);
            if (
                !('Content-Type' in finalHeaders) &&
                !('content-type' in finalHeaders)
            ) {
                finalHeaders['Content-Type'] = 'application/json';
            }
        } else {
            delete finalHeaders['Content-Type'];
            delete finalHeaders['content-type'];
        }

        try {
            const res = await fetch(finalURL, options);

            if (!res.ok) {
                let errorBody = null;

                try {
                    errorBody = await res.clone().json();
                } catch {
                    try {
                        errorBody = await res.text();
                    } catch {
                        errorBody = null;
                    }
                }

                const error = new Error(
                    `HTTP error ${res.status} ${res.statusText || ''}`.trim()
                );
                error.status = res.status;
                error.body = errorBody;
                error.url = finalURL;
                throw error;
            }

            if (res.status === 204 || res.status === 205) {
                return null;
            }

            try {
                return await res.json();
            } catch (err) {
                const parseError = new Error(
                    `Nie udało się zdekodować JSON z odpowiedzi: ${err.message}`
                );
                parseError.url = finalURL;
                throw parseError;
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                const timeoutErr = new Error(
                    `Żądanie przekroczyło czas ${timeout} ms (${finalURL})`
                );
                timeoutErr.name = 'TimeoutError';
                timeoutErr.url = finalURL;
                timeoutErr.timeout = timeout;
                timeoutErr.cause = err;
                throw timeoutErr;
            }

            if (err instanceof TypeError) {
                const netErr = new Error(`Błąd sieci: ${err.message}`);
                netErr.cause = err;
                netErr.url = finalURL;
                throw netErr;
            }

            throw err;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}
