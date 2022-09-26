import { DataCacheStrategy } from '@themost/cache';
class DiskCacheStrategy extends DataCacheStrategy {
    constructor(configuration) {
        super(configuration);
    }

}

export {
    DiskCacheStrategy
}