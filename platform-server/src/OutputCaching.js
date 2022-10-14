import { ConfigurationBase } from '@themost/common';
import { DiskCacheStrategy } from './DiskCacheStrategy';

function sortAscending(a, b) {
    if (a < b) {
        return 1;
    }
    if (a > b) {
        return -1;
    }
    return 0;
}

class OutputCaching {
    /**
     * @param {import('./OutputCaching').OutputCacheConfiguration} config
     * @returns {import('@types/express').Handler}
     */
    static setup(config) {
        const configuration = new ConfigurationBase();
        if (config) {
            configuration.getSourceAt('settings/cache', config);
        }
        const cacheStrategy = new DiskCacheStrategy(configuration);
        return function(req, res, next) {
            Object.defineProperty(req, 'cache', {
                configurable: true,
                enumerable: false,
                writable: false,
                get: () => cacheStrategy
            });
            return next();
        }
    }

    /**
     * @param {import('./OutputCaching').PreOutputCacheConfiguration} options
     * @returns {import('@types/express').Handler}
     */
    static preCache(options) {
    return function(req, res, next) {
        if (options.duration <= 0) {
            // do nothing
            return next();
        }
        (async () => {
            const path = req.path;
            const contentEncoding = options.varyByContentEncoding;
            // get headers
            let headers = null;
            if (options.varyByHeader && options.varyByHeader.length) {
                headers = options.varyByHeader.sort((a, b) => {
                    return sortAscending(a, b);
                }).map((header) => {
                    if (Object.prototype.hasOwnProperty.call(req.headers, header)) {
                        return `${header}=${encodeURIComponent(req.headers[header])}`;
                    }
                    return `${header}=`;
                }).join('&');
            }
            // get params
            let params = null;
            if (options.varyByParam && options.varyByParam.length) {
                params = options.varyByParam.sort((a, b) => {
                    return sortAscending(a, b);
                }).map((header) => {
                    if (Object.prototype.hasOwnProperty.call(req.query, header)) {
                        return `${header}=${encodeURIComponent(req.query[header])}`;
                    }
                    return `${header}=`;
                }).join('&');
            }
            let customParams;
            if (options.varyByCallback) {
                customParams = await options.varyByCallback(req);
            }
            return {
                path,
                headers,
                contentEncoding,
                params,
                customParams
            };
        })().then((value) => {
            if (value == null) {
                return next();
            }
            // set output cache attributes
            req.outputCache = value;
            return req.cache.has(req.outputCache).then((exists) => {
                if (exists === false) {
                    return next();
                }
                // use client-side caching
                if (options.location === 'client') {
                    return res.status(304).send();
                    // use server-side caching
                } else if (options.location === 'server') {
                    return req.cache.get(req.outputCache).then((content) => {
                        res.status(200).send(content);
                    });
                }
                return next();
            });
        }).catch((err) => {
            return next(err);
        });
    }
}



}

export {
    OutputCaching
}