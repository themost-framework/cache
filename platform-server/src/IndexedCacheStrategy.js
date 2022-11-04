import { DataCacheStrategy } from '@themost/cache';
import { Args, Guid, TraceUtils, LangUtils } from '@themost/common';
import { QueryExpression } from '@themost/query';
import { IndexedCache } from './IndexedCache';
import { CacheEntry } from './models/CacheEntry';
import path from 'path';
import mkdirp from 'mkdirp';
import {readFile, writeFile, unlink, stat} from 'fs';
import {promisify} from 'util';

const readFileAsync = promisify(readFile);
const statAsync = promisify(stat);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

class IndexedCacheStrategy extends DataCacheStrategy {

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
        this.rawCache = new IndexedCache(configuration);
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
         * @type {import('./IndexedCache').IndexedCache}
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
                 ).where('expiredAt').lowerOrEqual(new Date())
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
         * @type {import('./IndexedCache').IndexedCacheContext}
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
         * @type {import('./IndexedCache').IndexedCacheContext}
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
                return null;
             }
             if (typeof key !== 'string') {
                Object.assign(key, entry);
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
         * @type {import('./IndexedCache').IndexedCache}
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
     * @param {string|CompositeKey} key 
     * @returns {Promise<CompositeKey>}
     */
    async has(key) {
        //
        /**
         * @type {import('./IndexedCache').IndexedCache}
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
        //
    }

    finalize() {
        if (this.killCheckPeriod) {
            clearInterval(this.killCheckPeriod);
        }
    }

    /**
     * @param {string|CompositeKey} key 
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

    /**
     * Reads file from disk cache
     * @param {import('@themost/cache').CacheItem} entry 
     * @returns Promise<Buffer>
     */
     async read(entry) {
        Args.check(Guid.isGuid(entry.id), 'Entry identifier must be a valid uuid at this context');
        const fileName = entry.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.getConfiguration().getSourceAt('settings/cache/rootDir');
        if (rootDir == null) {
            rootDir = '.cache/indexedCache';
        }
        const finalRootDir = path.resolve(process.cwd(), rootDir);
        // get file path
        const filePath = path.resolve(finalRootDir, fileDir, fileName);
        /**
         * @type {Stats}
         */
        const stats = await statAsync(path.resolve(finalRootDir, fileDir, fileName));
        // validate
        Args.check(stats.isFile(), 'Entry cannot be found or is inaccessible');
        // and return
        return await readFileAsync(filePath);
    }

    /**
     * @param {import('@themost/cache').CacheItem} entry 
     */
    async unlink(entry) {
        Args.check(Guid.isGuid(entry.id), 'Entry identifier must be a valid uuid at this context');
        const fileName = entry.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.getConfiguration().getSourceAt('settings/cache/rootDir');
        if (rootDir == null) {
            rootDir =  '.cache/indexedCache'
        }
        const finalRootDir = path.resolve(process.cwd(), rootDir);
        // get file path
        const filePath = path.resolve(finalRootDir, fileDir, fileName);
        try {
            /**
             * @type {Stats}
             */
            const stats = await statAsync(path.resolve(finalRootDir, fileDir, fileName));
            // validate
            Args.check(stats.isFile(), 'Entry cannot be found or is inaccessible');
            // and return
            return await unlinkAsync(filePath);
        } catch (err) {
            if (err.code === 'ENOENT') {
                return;
            }
            throw err;
        }
    }

    /**
     * @param {import('@themost/cache').CacheItem} entry 
     * @param {*} content 
     * @returns Promise<string>
     */
    async write(entry, content) {
        Args.check(Guid.isGuid(entry.id), 'Entry identifier must be a valid uuid at this context');
        const fileName = entry.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.getConfiguration().getSourceAt('settings/cache/rootDir');
        if (rootDir == null) {
            rootDir =  '.cache/indexedCache'
        }
        const finalFileDir = path.resolve(process.cwd(), rootDir, fileDir);
        // ensure that directory exists
        await mkdirp(finalFileDir);
        // get file path
        const filePath = path.resolve(finalFileDir, fileName);
        // and write file
        await writeFileAsync(filePath, content, 'binary');
    }

}

export {
    IndexedCacheStrategy
}