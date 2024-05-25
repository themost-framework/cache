const NodeCache = require('node-cache');
import { DataCacheStrategy } from '@themost/cache';
import { LangUtils } from '@themost/common';

const CACHE_ABSOLUTE_EXPIRATION = 1200;

class DefaultDataCacheStrategy extends DataCacheStrategy {

    absoluteExpiration;
    constructor(configuration) {
        super(configuration);
        this.absoluteExpiration = CACHE_ABSOLUTE_EXPIRATION;
        const absoluteExpiration = LangUtils.parseInt(configuration.getSourceAt('settings/cache/absoluteExpiration'));
        if (absoluteExpiration>0) {
            this.absoluteExpiration = absoluteExpiration;
        }
        this.rawCache = new NodeCache({
            stdTTL: this.absoluteExpiration
        });
    }

    /**
     * Gets a cached value defined by the given key.
     * @param {string|CompositeCacheKey} key
     * @returns {Promise<any>}
     */
    async get(key) {
        // noinspection JSCheckFunctionSignatures
        return this.rawCache.get(key);
    }
    
    /**
     * Sets a key value pair in cache.
     * @abstract
     * @param {string|CompositeCacheKey} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise<void>}
     */
    async add(key, value, absoluteExpiration) {
        // noinspection JSCheckFunctionSignatures
        this.rawCache.set(key, value, absoluteExpiration);
    }
    /**
     * Removes a cached value.
     * @abstract
     * @param {string|CompositeCacheKey} key - A string that represents the key of the cached value to be removed
     * @returns {Promise<any>}
     */
    async remove(key) {
        // noinspection JSCheckFunctionSignatures
        if (/\*/.test(key)) {
            const reKey = new RegExp(key.replace(/\*/g, '.*'));
            const keys = this.rawCache.keys();
            const delKeys = keys.filter((k) => {
                return reKey.test(k);
            });
            const delCount = this.rawCache.del(delKeys);
            return !!delCount;
        }
        const count = this.rawCache.del(key);
        return !!count;
    }

    async has(key) {
        // noinspection JSCheckFunctionSignatures
        const exists = this.rawCache.has(key);
        if (exists) {
            // noinspection JSValidateTypes
            return {
                path: key
            }
        }
        return null;
    }

    /**
     * Flushes cached data.
     * @abstract
     * @returns {Promise<void>}
     */
    async clear() {
        this.rawCache.flushAll();
    }

    /**
     * @function
     * @name NodeCache#_killCheckPeriod
     */

    /**
     * @returns {Promise<void>}
     */
    finalize() {
        return this.clear().then(() => {
            // destroy timer
            if (this.rawCache && typeof this.rawCache._killCheckPeriod === 'function') {
                this.rawCache._killCheckPeriod();
            }
        });
    }

}

export {
    DefaultDataCacheStrategy
}
