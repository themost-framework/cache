import { NodeCache } from 'node-cache';
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

    get(key) {
        return new Promise((resolve, reject) => {
            this.rawCache.get(key, (err, res) => {
                if (err) {
                    return reject(err);
                }
                const descriptor = Object.getOwnPropertyDescriptor(res, key);
                if (descriptor == null) {
                    return resolve();
                }
                return resolve(descriptor.value);
            });
        });
    }

    add(key, value, absoluteExpiration) {
        return new Promise((resolve, reject) => {
            this.rawCache.set(key, value, absoluteExpiration, (err) => {
                if (err) {
                    return reject(err);
                }
                return resolve();
            });
        });    
    }

    remove(key) {
        return new Promise((resolve, reject) => {
            this.rawCache.del(key, (err, count) => {
                if (err) {
                    return reject(err);
                }
                return resolve(count);
            });
        });
    }

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