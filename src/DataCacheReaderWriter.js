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
    // eslint-disable-next-line no-unused-vars
     async read(entry) {
        throw new AbstractMethodError();
     }

      // noinspection JSUnusedLocalSymbols
    /**
     * @param {import('./DataCacheStrategy').CacheItem} entry 
     */
      // eslint-disable-next-line no-unused-vars
    async unlink(entry) {
        throw new AbstractMethodError();
    }

    // noinspection JSUnusedLocalSymbols
    /**
     * @param {import('./DataCacheStrategy').CacheItem} entry 
     * @param {*} content 
     * @returns Promise<string>
     */
    // eslint-disable-next-line no-unused-vars
     async write(entry, content) {
        throw new AbstractMethodError();
     }

}

export {
    DataCacheReaderWriter
}
