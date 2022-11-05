import {ConfigurationStrategy, AbstractMethodError, AbstractClassError} from '@themost/common';

/**
 * @interface CompositeCacheKey
 */

class DataCacheReaderWriter extends ConfigurationStrategy {
    constructor(configuration) {
        super(configuration);
        if (this.constructor === DataCacheReaderWriter.prototype.constructor) {
            throw new AbstractClassError();
        }
    }

    /**
     * Reads file from disk cache
     * @abstract
     * @param {import('./DataCacheStrategy').CacheItem} entry 
     * @returns Promise<Buffer>
     */
     async read(entry) {
        throw new AbstractMethodError();
     }

      /**
     * @param {import('./DataCacheStrategy').CacheItem} entry 
     */
    async unlink(entry) {
        throw new AbstractMethodError();
    }

    /**
     * @param {import('./DataCacheStrategy').CacheItem} entry 
     * @param {*} content 
     * @returns Promise<string>
     */
     async write(entry, content) {
        throw new AbstractMethodError();
     }

}

export {
    DataCacheReaderWriter
}