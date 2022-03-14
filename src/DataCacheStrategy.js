import {ConfigurationStrategy, AbstractMethodError, AbstractClassError} from '@themost/common';

class DataCacheStrategy extends ConfigurationStrategy {
    constructor(configuration) {
        super(configuration);
        if (this.constructor === DataCacheStrategy.prototype.constructor) {
            throw new AbstractClassError();
        }
    }
    /* istanbul ignore next */
    /**
     * Sets a key value pair in cache.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value
     * @param {*} value - The value to be cached
     * @param {number=} absoluteExpiration - An absolute expiration time in seconds. This parameter is optional.
     * @returns {Promise<void>}
     */
    // eslint-disable-next-line no-unused-vars
    async add(key, value, absoluteExpiration) {
        throw new AbstractMethodError();
    }

    /* istanbul ignore next */
    /**
     * Removes a cached value.
     * @abstract
     * @param {string} key - A string that represents the key of the cached value to be removed
     * @returns {Promise<any>}
     */
    // eslint-disable-next-line no-unused-vars
    async remove(key) {
        throw new AbstractMethodError();
    }

    /* istanbul ignore next */
    /**
     * Flushes cached data.
     * @abstract
     * @returns {Promise<void>}
     */
    async clear() {
        throw new AbstractMethodError();
    }

    /* istanbul ignore next */
    /**
     * 
     * Gets a cached value defined by the given key.
     * @param {string} key
     * @returns {Promise<any>}
     */
    // eslint-disable-next-line no-unused-vars
    async get(key) {
        throw new AbstractMethodError();
    }

    /**
     * Returns an item which is going to be added to cache
     * @name GetItemFunction
     * @function
     * @returns {Promise<any>}
    */

    /**
     * Gets data from cache or executes the given function and adds the result to cache
     * @param {string} key 
     * @param {GetItemFunction} getFunc 
     * @param {number=} absoluteExpiration 
     */
    async getOrDefault(key, getFunc, absoluteExpiration) {
        let item = await this.get(key);
        if (item == null) {
            item = await getFunc();
            if (item != null) {
                await this.add(key, item, absoluteExpiration);
            }
        }
        return item;
    }

}

export {
    DataCacheStrategy
}