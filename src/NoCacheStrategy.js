import { DataCacheStrategy } from './DataCacheStrategy';

class NoCacheStrategy extends DataCacheStrategy {
    constructor(configuration) {
        super(configuration);
    }

    // eslint-disable-next-line no-unused-vars
    async add(key, value, absoluteExpiration) {
        
    }

    // eslint-disable-next-line no-unused-vars
    async get(key) {

    }

    // eslint-disable-next-line no-unused-vars
    async has(key) {

    }

    // eslint-disable-next-line no-unused-vars
    async remove(key) {

    }

    async clear() {
        // do nothing
    }

    async finalize() {
        // do nothing
    }
}

export {
    NoCacheStrategy
}
