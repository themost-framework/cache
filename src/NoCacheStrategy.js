import { DataCacheStrategy } from './DataCacheStrategy';

class NoCacheStrategy extends DataCacheStrategy {
    constructor(configuration) {
        super(configuration);
    }

    // eslint-disable-next-line no-unused-vars
    async add(key, value, absoluteExpiration) {
        return;
    }

    // eslint-disable-next-line no-unused-vars
    async get(key) {
        return;
    }

    // eslint-disable-next-line no-unused-vars
    async has(key) {
        return;
    }

    // eslint-disable-next-line no-unused-vars
    async remove(key) {
        return;
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