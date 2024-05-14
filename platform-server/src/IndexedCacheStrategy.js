import { DataCacheStrategy, DataCacheReaderWriter } from '@themost/cache';
import { TraceUtils, LangUtils } from '@themost/common';
import { QueryExpression } from '@themost/query';
import { DiskCacheReader } from './DiskCacheReader';
import { IndexedCache } from './IndexedCache';
import { CacheEntry } from './models';

class IndexedCacheStrategy extends DataCacheStrategy {

    /**
     * @type {number}
     */
    absoluteExpiration = 1200; // 20 minutes
    /**
     * @type {NodeJS.Timeout}
     */
    killCheckPeriod;
    /**
     * @type {boolean}
     */
    checkingPeriod = false;

    /**
     * @type {import('./IndexedCache').IndexedCache}
     */
    rawCache

    /**
     * @param {import('@themost/common').ConfigurationBase} configuration
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
        this.rawCache = new IndexedCache(configuration);
        this.killCheckPeriod = setInterval(() => {
            if (this.checkingPeriod) {
                return;
            }
            this.checkingPeriod = true;
            this.onCheck().catch((err) => {
                TraceUtils.error('An error occurred while checking expiration of disk cache entries');
                TraceUtils.error(err);
            }).finally(() => {
                this.checkingPeriod = false;
            });
        }, checkPeriod * 1000);
        // validate cache reader
        const reader  = configuration.getStrategy(DataCacheReaderWriter);
        if (reader == null) {
            configuration.useStrategy(DataCacheReaderWriter, DiskCacheReader);
        }
    }

    async onCheck() {
        /**
         * @type {import('./IndexedCache').IndexedCache|*}
         */
         let context;
         try {
             context = this.rawCache.createContext();
             const model = context.model(CacheEntry);
             await context.db.executeAsync(
                 new QueryExpression().update(model.sourceAdapter).set(
                     {
                         doomed: true
                     }
                 ).where('expiredAt').lowerOrEqual(new Date()),
                 []
             );
             const items = await context.model(CacheEntry).where('doomed').equal(true).select('id').getItems();
             if (items.length) {
                 for (const item of items) {
                     await context.model(CacheEntry).remove(item);
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
         * @type {import('./IndexedCache').IndexedCacheContext|*}
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
            await context.model(CacheEntry).subscribeOnce('after.save', async (event) => {
                if (event.state !== 1) {
                    return;
                }
                /**
                 * @type {CacheEntry}
                 */
                const target = event.model.convert(event.target);
                if (target && target.location === 'client') {
                    return;
                }
                // write content
                if (value instanceof Buffer) {
                    await target.write(value);
                } else {
                    await target.write(Buffer.from(JSON.stringify(value)));
                }
            }).save(entry);

            if (typeof key !== 'string') {
                Object.assign(key, entry);
            }

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
         * @type {import('./IndexedCache').IndexedCacheContext|*}
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
              * @type {CacheEntry}
              */
             const item = await context.model(CacheEntry).find(entry).getTypedItem();
             if (item == null) {
                return undefined;
             }
             if (typeof key !== 'string') {
                Object.assign(key, entry);
             }
             // get file content
             const buffer = await item.read();
             if (item.contentEncoding && item.contentEncoding.startsWith('application/json')) {
                // noinspection JSCheckFunctionSignatures
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
         * @type {import('./IndexedCache').IndexedCache|*}
         */
         let context;
         try {
             context = this.rawCache.createContext();
             let entry;
             if (typeof key === 'string') {
                 entry = {
                     path: key
                 }
                 if (/\*/.test(key)) {
                     const paths = key.split('*');
                     // get path with maximum length
                     let entryPath = paths[0];
                     paths.forEach((path) => {
                         if (path.length > entryPath.length) {
                             entryPath = path;
                         }
                     });
                     // convert expression to starts with or ends with
                     /**
                      * @type {import('@themost/data').DataQueryable}
                      */
                     const q = context.model(CacheEntry).where('path').contains(entryPath).equal(true);
                     // get items
                     const items = await q.getAllItems();
                     // filter items that match the expression
                     const rePath = new RegExp(key.replace(/\*/g, '.*'));
                     for (const item of items) {
                         if (rePath.test(item.path)) {
                             // remove item
                             await context.model(CacheEntry).remove(item);
                         }
                     }
                     return;
                 }
             } else {
                 entry = Object.assign({}, key);
             }
             /**
              * get entry
              * @type {CacheEntry}
              */
             const item = await context.model(CacheEntry).find(entry).getItem();
             if (item == null) {
                return;
             }
             await context.model(CacheEntry).remove(item); 
         } finally {
             if (context) {
                 await context.finalizeAsync();
             }
         }
    }

    /**
     * @param {string|import('@themost/cache').CompositeCacheKey} key
     * @returns {Promise<import('@themost/cache').CompositeCacheKey>}
     */
    async has(key) {
        //
        /**
         * @type {import('./IndexedCache').IndexedCache|*}
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
            return await context.model(CacheEntry).find(entry).getTypedItem();
         }  finally {
            if (context) {
                await context.finalizeAsync();
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    async clear() {
        let context;
        try {
            context = this.rawCache.createContext();
            const deleteItems = await context.model(CacheEntry).select('id').getAllItems();
            for (const item of deleteItems) {
                await context.model(CacheEntry).remove(item);
            }
        }
        finally {
            if (context) {
                await context.finalizeAsync();
            }
        }
    }

    finalize() {
        if (this.killCheckPeriod) {
            clearInterval(this.killCheckPeriod);
        }
    }

    /**
     * @param {string|import('@themost/cache').CompositeKey} key
     * @returns Promise<import('@themost/cache').CacheEntry>
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
            return await context.model(CacheEntry).find(entry).getTypedItem();
        } finally {
            if (context) {
                await context.finalizeAsync();
            }
        }
    }
}

export {
    IndexedCacheStrategy
}
