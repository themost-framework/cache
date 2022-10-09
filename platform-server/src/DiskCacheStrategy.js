import { DataCacheStrategy } from '@themost/cache';

class DiskCacheStrategy extends DataCacheStrategy {
    /**
     * @param {import('@themost/common').ConfigurationBase}
     */
    constructor(configuration) {
        super(configuration);
    }
    // eslint-disable-next-line no-unused-vars
    async add(key, value, absoluteExpiration) {
        // 
    }

    // eslint-disable-next-line no-unused-vars
    async remove(key) {
        //
    }

    // eslint-disable-next-line no-unused-vars
    async clear() {
        //
    }

    finalize() {
        //
    }


}

export {
    DiskCacheStrategy
}