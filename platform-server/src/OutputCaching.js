import { ConfigurationBase, TraceUtils } from '@themost/common';
import { MD5 } from 'crypto-js';
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

class OutputCachingMapper {
    /**
     * @type {import('./OutputCaching').PreOutputCacheConfiguration}
     */
    options;
    constructor(options) {
        this.options = options;
    }
    /**
     * 
     * @param {import('@types/express').Request} req
     */
    async map(req) {
        /**
         * @type {import('./OutputCaching').PreOutputCacheConfiguration}
         */
        const options = this.options;
        const duration = this.options.duration;
        const location = this.options.location;
        const path = req.baseUrl.toLowerCase();
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
            /**
             * @type {Array<string>}
             */
            let varyByParam;
            if (options.varyByParam.length === 1 && options.varyByParam[0] === '*') {
                // get any query param
                varyByParam = Object.keys(req.query);
            } else {
                varyByParam = options.varyByParaml
            }
            if (varyByParam.length > 0) {
                params = varyByParam.sort((a, b) => {
                    return sortAscending(a, b);
                }).map((queryParam) => {
                    if (Object.prototype.hasOwnProperty.call(req.query, queryParam)) {
                        return `${queryParam}=${encodeURIComponent(req.query[queryParam])}`;
                    }
                    return `${queryParam}=`;
                }).join('&');
            }
        }
        let customParams;
        if (options.varyByCallback) {
            customParams = await options.varyByCallback(req);
        }
        const result = {
            path,
            location,
            duration,
            headers,
            params,
            customParams
        };
        if (options.varyByContentEncoding) {
            Object.assign(result, {
                contentEncoding: options.varyByContentEncoding
            })
        }
        if (req.headers.etag && (location === 'client' || location === 'any' || location === 'serverAndClient')) {
            Object.assign(result, {
                entityTag: req.headers.etag
            })
        }
        return result;
    }

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
        return function (req, res, next) {
            Object.defineProperty(req, 'cache', {
                configurable: true,
                enumerable: false,
                get: () => cacheStrategy
            });
            return next();
        }
    }

    /**
     * @returns {import('@types/express').Handler}
     */
    static noCache() {
        return (req, res, next) => {
            res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', 0);
            return next();
        }
    }

    /**
     * @returns {import('@types/express').Handler}
     */
    static client() {
        return function (req, res, next) {
            if (req.outputCache == null) {
                return next();
            }
            return next();
        }
    }

    /**
     * @returns {import('@types/express').Handler}
     */
     static server() {
        return function (req, res, next) {
            if (req.outputCache == null) {
                return OutputCaching.noCache()(req, res, (err) => {
                    return next(err);
                });
            }
            return req.cache.get(req.outputCache).then((buffer) => {
                return OutputCaching.noCache()(req, res, (err) => {
                    if (err) {
                        return next(err);
                    }
                    if (buffer != null) {
                        return res.send(buffer);
                    }
                    const superWrite = res.write;
                    const superEnd = res.end;
                    let chunks = [];
                    // override write
                    res.write = (...args) => {
                        chunks.push(Buffer.from(args[0]));
                        superWrite.apply(res, args);
                    };
                    // override end
                    res.end = (...args) => {
                        if (args[0]) {
                            chunks.push(Buffer.from(args[0]));
                        }
                        if (res.statusCode === 200 || res.statusCode === 204) {
                            req.outputCache.contentEncoding = res.getHeader('Content-Type');
                            return req.cache.add(req.outputCache, Buffer.concat(chunks)).then(() => {
                                return superEnd.apply(res, args);
                            }).catch((err) => {
                                TraceUtils.error('An error occurred while adding cache entry');
                                TraceUtils.error(err);
                                return superEnd.apply(res, args);
                            }).finally(() => {
                                chunks = [];
                            });
                        }
                        return superEnd.apply(res, args);
                    };
                    return next();
                });
            }).catch((err) => {
                return next(err);
            })
            
        }
    }

    /**
     * @param {import('./OutputCaching').PreOutputCacheConfiguration=} options
     * @returns {import('@types/express').Handler}
     */
    static cache(options) {
        // get caching options or defaults
        const cachingOptions = options || {
            location: 'server',
            duration: 20 * 60, // 20 minutes
            varyByHeader: [
                'accept',
                'accept-encoding',
                'accept-language',
                'accept-profile'
            ],
            varyByParam: [
                '*' // use any query param
            ],
            varyByCallback: async (req) => {
                if (req.headers.authorization) {
                    return `context=${MD5(req.headers.authorization).toString()}`
                }
                return null;
            } 
        }
        return function (req, res, next) {
            if ((req.method === 'GET' || req.method === 'HEAD') === false) {
                return next();
            }
            if (cachingOptions.duration <= 0) {
                // do nothing (no-cache)
                return next();
            }
            (async () => {
                return await new OutputCachingMapper(cachingOptions).map(req);
            })().then((value) => {
                if (value == null) {
                    return OutputCaching.noCache()(req, res, next);
                }
                // set output cache attributes
                req.outputCache = value;
                // use client-side caching
                if (cachingOptions.location === 'client') {
                    return OutputCaching.client()(req, res, next);
                    // use server-side caching
                } else if (cachingOptions.location === 'server') {
                    return OutputCaching.server()(req, res, next);
                }
                return next();
            }).catch((err) => {
                return next(err);
            });
        }
    }



}

export {
    OutputCaching
}