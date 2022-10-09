import { DataCacheStrategy } from '@themost/cache';
import { TraceUtils, LangUtils } from '@themost/common';
import { DiskCache } from './DiskCache';
import { DiskCacheEntry } from './models/DiskCacheEntry';

class DiskCacheStrategy extends DataCacheStrategy {

    /**
     * @type {number}
     */
    absoluteExpiration = 1200; // 20 minutes
    /**
     * @type {NodeJS.Timer}
     */
    killCheckPeriod;
    /**
     * @type {boolean}
     */
    checkingPeriod = false;

    /**
     * @type {DiskCache}
     */
    rawCache

    /**
     * @param {import('@themost/common').ConfigurationBase}
     */
    constructor(configuration) {
        super(configuration);
        let checkPeriod = configuration.getSourceAt('settings/cache/checkPeriod');
        if (checkPeriod == null) {
            checkPeriod = 60;
        }
        // get default expiration from configuration
        const expiration = LangUtils.parseInt(configuration.getSourceAt('settings/cache/absoluteExpiration'));
        if (expiration > 0) {
            this.absoluteExpiration = expiration;
        }
        this.rawCache = new DiskCache(configuration);
        this.killCheckPeriod = setInterval(() => {
            // validate cache and clear outdated items
            if (this.checkingPeriod) {
                return;
            }
            (async () => {
                /**
                 * @type {import('./DiskCache').DiskCacheContext}
                 */
                let context;
                try {
                    context = this.rawCache.createContext();
                    const items = await context.model(DiskCacheEntry).where('expiredAt').lowerOrEqual(new Date())
                        .select('id').silent().getItems();
                    if (items.length) {
                        for (const item of items) {
                            await context.model(DiskCacheEntry).remove(item);
                        }
                    }
                } finally {
                    if (context) {
                        await context.finalizeAsync();
                    }
                }
            })().catch((err) => {
                TraceUtils.error('An error occured while checking expiration of disk cache entries');
                TraceUtils.error(err);
            }).finally(() => {
                this.checkingPeriod = false;
            });
            
        }, checkPeriod * 1000);
    }
    /**
     * @param {string|*} key
     * @param {*} value
     * @param {number=} absoluteExpiration
     * @returns {Promise<any>}
     */
    async add(key, value, absoluteExpiration) {
        /**
         * @type {import('./DiskCache').DiskCacheContext}
         */
        let context;
        try {
            context = this.rawCache.createContext();
            let entry;
            const duration = absoluteExpiration ? absoluteExpiration : this.absoluteExpiration;
            if (typeof key === 'string') {
                const path = key;
                entry = {
                    path,
                    duration
                }
            } else {
                entry = Object.assign({}, key, {
                    duration
                });
            }
            context.model(DiskCacheEntry).subscribeOnce(async (event) => {
                /**
                 * @type {DiskCacheEntry}
                 */
                const target = event.model.convert(event.target);
                // write content
                await target.write(value);
            }).silent().save(entry);

        } finally {
            if (context) {
                await context.finalizeAsync();
            }
        }
    }

    /**
     * @param {string|*} key
     * @returns {Promise<any>}
     */
    async get(key) {
        /**
         * @type {import('./DiskCache').DiskCacheContext}
         */
         let context;
         try {
            context = this.rawCache.createContext();
             let entry;
             if (typeof key === 'string') {
                 entry = {
                     path: key,
                     headers: null,
                     params: null,
                     customParams: null,
                     contentEncoding: null
                 }
             } else {
                 entry = Object.assign({}, key);
             }
             /**
              * get entry
              * @type {DiskCacheEntry}
              */
             const item = await context.model(DiskCacheEntry).silent().find(entry).getItem();
             if (item == null) {
                return null;
             }
             // get file content
             return await item.read();
 
         } finally {
             if (context) {
                 await context.finalizeAsync();
             }
         }
    }

    /**
     * @param {string|*} key
     * @returns {Promise<void>}
     */
    async remove(key) {
        /**
         * @type {import('./DiskCache').DiskCacheContext}
         */
         let context;
         try {
             context = this.rawCache.createContext();
             let entry;
             if (typeof key === 'string') {
                 entry = {
                     path: key,
                     headers: null,
                     params: null,
                     customParams: null,
                     contentEncoding: null
                 }
             } else {
                 entry = Object.assign({}, key);
             }
             /**
              * get entry
              * @type {DiskCacheEntry}
              */
             const item = await context.model(DiskCacheEntry).silent().find(entry).getItem();
             if (item == null) {
                return;
             }
             await context.model(DiskCacheEntry).silent().remove(item); 
         } finally {
             if (context) {
                 await context.finalizeAsync();
             }
         }
    }

    // eslint-disable-next-line no-unused-vars
    async clear() {
        //
    }

    finalize() {
        if (this.killCheckPeriod) {
            clearInterval(this.killCheckPeriod);
        }
    }


}

export {
    DiskCacheStrategy
}