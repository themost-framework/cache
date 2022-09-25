/**
 * @function VaryByCallback
 * @param {*} context
 * @returns {Promise<string>}
 */

/**
 * @interface OutputCacheConfiguration
 * @property {number=} duration Gets or sets the cache duration, in seconds
 * @property {boolean=} noStore Gets or sets a value that indicates whether to store the cache.
 * @property {string} location Gets or sets the location.
 * @property {Array<string>=} varyByHeader Gets or sets the vary-by-header values
 * @property {Array<string>=} varyByParam Gets or sets the vary-by-param values
 * @property {Array<string>=} varyByContentEncoding Gets or sets the vary-by-content encodings
 * @property {VaryByCallback=} varyByCallback Gets or sets a vary-by-custom callback
 */

/**
 * @param {OutputCacheConfiguration} options
 * @returns {(function(*, string, *))}
 */
function outputCache(options) {
    return function(target) {
        if ((target.descriptor != null && typeof target.descriptor.value === 'function') === false) {
            throw new TypeError('Invalid descriptor. Expected class method.');
        }
        Object.defineProperty(target.descriptor.value, 'outputCache', {
            configurable: true,
            enumerable: false,
            value: options
        });
    }
}

export {
    outputCache
}
