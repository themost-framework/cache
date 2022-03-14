const NodeCache = require('node-cache');
import { DataCacheStrategy } from './DataCacheStrategy';
import { LangUtils } from '@themost/common';

const CACHE_ABSOLUTE_EXPIRATION = 1200;

class DefaultDataCacheStrategy extends DataCacheStrategy {

    constructor(configuration) {
        super(configuration);
        let expiration = CACHE_ABSOLUTE_EXPIRATION;
        const absoluteExpiration = LangUtils.parseInt(configuration.getSourceAt('settings/cache/absoluteExpiration'));
        if (absoluteExpiration>0) {
            expiration = absoluteExpiration;
        }
        this.rawCache = new NodeCache({
            stdTTL:expiration
        });
    }

    /**
     * Gets a cached value defined by the given key.
     * @param {string} key
     * @returns {Promise<any>}
     */
    get(key) {
        return new Promise((resolve, reject) => {
            try {
                const result = this.rawCache.get(key);
                return resolve(result);
            } catch (err) {
                return reject(err);
            }
        });
    }
    
    /**
     * Sets a key value pair in cache.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise<void>}
     */
    add(key, value, absoluteExpiration) {
        return new Promise((resolve, reject) => {
            try {
                this.rawCache.set(key, value, absoluteExpiration);
                return resolve();
            } catch (err) {
                return reject(err);
            }
        });    
    }
    /**
     * Removes a cached value.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Promise<any>}
     */
    remove(key) {
        return new Promise((resolve, reject) => {
            try {
                const count = this.rawCache.del(key);
                return resolve(!!count);
            } catch (err) {
                return reject(err);
            }
        });
    }

    /**
     * Flushes cached data.
     * @abstract
     * @returns {Promise<void>}
     */
    clear() {
        return new Promise((resolve, reject) => {
            try {
                this.rawCache.flushAll();
            } catch (err) {
                return reject(err);
            }
            return resolve();
        });
    }

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