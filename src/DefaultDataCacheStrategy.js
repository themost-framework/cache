const NodeCache = require('node-cache');
import { DataCacheStrategy } from './DataCacheStrategy';
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
     * @param {string} key
     * @returns {Promise<any>}
     */
    async get(key) {
        return this.rawCache.get(key);
    }
    
    /**
     * Sets a key value pair in cache.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise<void>}
     */
    async add(key, value, absoluteExpiration) {
        this.rawCache.set(key, value, absoluteExpiration);   
    }
    /**
     * Removes a cached value.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Promise<any>}
     */
    async remove(key) {
        const count = this.rawCache.del(key);
        return !!count;
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
