import { DataCacheStrategy } from '@themost/cache';
import { TraceUtils, LangUtils } from '@themost/common';
import { QueryExpression } from '@themost/query';
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
            if (this.checkingPeriod) {
                return;
            }
            this.checkingPeriod = true;
            this.onCheck().catch((err) => {
                TraceUtils.error('An error occured while checking expiration of disk cache entries');
                TraceUtils.error(err);
            }).finally(() => {
                this.checkingPeriod = false;
            });
        }, checkPeriod * 1000);
    }

    async onCheck() {
        /**
         * @type {import('./DiskCache').DiskCacheContext}
         */
         let context;
         try {
             context = this.rawCache.createContext();
             const model = context.model(DiskCacheEntry);
             await context.db.executeAsync(
                 new QueryExpression().update(model.sourceAdapter).set(
                     {
                         doomed: true
                     }
                 ).where('expiredAt').lowerOrEqual(new Date())
             );
             const items = await context.model(DiskCacheEntry).where('doomed').equal(true).select('id').getItems();
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
                entry = Object.assign({
                    duration
                }, key);
            }

            // set default content encoding
            const contentEncoding = (value instanceof Buffer) ? 'application/octet-stream': 'application/json';
            entry.contentEncoding = entry.contentEncoding || contentEncoding;
            await context.model(DiskCacheEntry).subscribeOnce('after.save', async (event) => {
                if (event.state !== 1) {
                    return;
                }
                /**
                 * @type {DiskCacheEntry}
                 */
                const target = event.model.convert(event.target);
                // write content
                if (value instanceof Buffer) {
                    await target.write(value);
                } else {
                    await target.write(Buffer.from(JSON.stringify(value)));
                }
            }).save(entry);

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
                     doomed: false
                 }
             } else {
                 entry = Object.assign({}, key, {
                    doomed: false
                 });
             }
             /**
              * get entry
              * @type {DiskCacheEntry}
              */
             const item = await context.model(DiskCacheEntry).find(entry).getTypedItem();
             if (item == null) {
                return null;
             }
             // get file content
             const buffer = await item.read();
             if (item.contentEncoding && item.contentEncoding.startsWith('application/json')) {
                return JSON.parse(buffer);
             }
             return buffer;
 
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
                     customParams: null
                 }
             } else {
                 entry = Object.assign({}, key);
             }
             /**
              * get entry
              * @type {DiskCacheEntry}
              */
             const item = await context.model(DiskCacheEntry).find(entry).getItem();
             if (item == null) {
                return;
             }
             await context.model(DiskCacheEntry).remove(item); 
         } finally {
             if (context) {
                 await context.finalizeAsync();
             }
         }
    }

    /**
     * @param {string|CompositeKey} key 
     * @returns {Promise<boolean>}
     */
    async has(key) {
        //
        /**
         * @type {import('./DiskCache').DiskCacheContext}
         */
         let context;
         let entry;
         try {
            context = this.rawCache.createContext();
            if (typeof key === 'string') {
                entry = {
                    path: key,
                    headers: null,
                    params: null,
                    customParams: null,
                    doomed: false
                }
            } else {
                entry = Object.assign({}, key, {
                    doomed: false
                });
            }
            const count = await context.model(DiskCacheEntry).find(entry).count();
            return count > 0;
         }  finally {
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

    /**
     * @param {string|CompositeKey} key 
     * @returns Promise<DiskCacheEntry>
     */
    async find(key) {
        let context;
        try {
            context = this.rawCache.createContext();
            let entry;
            if (typeof key === 'string') {
                entry = {
                    path: key,
                    headers: null,
                    params: null,
                    customParams: null
                }
            } else {
                entry = Object.assign({}, key);
            }
            return await context.model(DiskCacheEntry).find(entry).getTypedItem();
        } finally {
            if (context) {
                await context.finalizeAsync();
            }
        }
    }


}

export {
    DiskCacheStrategy
}