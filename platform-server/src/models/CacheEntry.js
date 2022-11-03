import { DataObject } from '@themost/data';
import { Args, Guid, TraceUtils } from '@themost/common';
import { Id, Entity, Column, Formula, ColumnDefault, Table, PostRemove, EntityListeners } from '@themost/jspa';
// eslint-disable-next-line no-unused-vars
import {readFile, writeFile, unlink, stat} from 'fs';
import path from 'path';
import {promisify} from 'util';
import mkdirp from 'mkdirp';
import { MD5 } from 'crypto-js';

const moment = require('moment');

const readFileAsync = promisify(readFile);
const statAsync = promisify(stat);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);

class OnRemoveCacheEntry {
    @PostRemove()
    async onPostRemove(event) {
        try {
            const model = event.model;
            /**
             * @type {CacheEntry}
             */
            const target = model.convert(event.target);
            // unlink file
            await target.unlink();
        } catch (err) {
            TraceUtils.warn('Disk cache entry content cannot be released because of an error occurred while unlinking file.');
            TraceUtils.warn(err);
        }
    }
}

@Entity({
    version: '1.1.2'
})
@EntityListeners(OnRemoveCacheEntry)
@Table({
    uniqueConstraints: [{
        columnNames: [
            'path',
            'location',
            'contentEncoding',
            'headers',
            'params',
            'customParams'
        ]
    }]
})
class CacheEntry extends DataObject {
    /**
     * @type {number}
     */
    @Id()
    @Formula(() => Guid.newGuid().toString())
    @Column({
        length: 36,
        type: 'Guid'
    })
    id;

    /**
     * @type {string}
     */
    @Column({
        length: 1024,
        type: 'Text'
    })
    path;

    /**
     * @type {string}
     */
    @Column({
        length: 1024,
        type: 'Text'
    })
    headers;

    /**
     * @type {boolean}
     */
     @Column({
        type: 'Boolean'
    })
    @ColumnDefault(() => false)
    doomed;

    /**
     * @type {string}
     */
    @Column({
        type: 'Text'
    })
    contentEncoding;

    /**
     * @type {string}
     */
     @ColumnDefault(() => 'server')
     @Column({
        type: 'Text',
        length: 24
    })
    location;

    /**
     * @type {string}
     */
    @Column({
        length: 1024,
        type: 'Text'
    })
    params;

    /**
     * @type {string}
     */
    @Column({
        length: 1024,
        type: 'Text'
    })
    customParams;

    /**
     * @type {number}
     */
    @Column({
        type: 'Integer',
        updatable: false,
        nullable: false
    })
    duration;

    /**
     * @type {Date}
     */
    @ColumnDefault(() => new Date())
    @Column({
        updatable: false,
        nullable: false
    })
    createdAt;

    /**
     * @type {Date}
     */
     @ColumnDefault((event) => moment(event.target.createdAt).add(event.target.duration, 'seconds').toDate())
     @Column({
        nullable: false
     })
     expiredAt;

    /**
     * @type {Date}
     */
    @Formula(() => new Date())
    modifiedAt;

    /**
     * @type {string}
     */
     @Column({
        type: 'Text'
    })
    @ColumnDefault((event) => CacheEntry.inferEntityTag(event.target))
    entityTag;

    /**
     * 
     * @param {CacheEntry|*} target 
     * @returns {string}
     */
    static inferEntityTag(target) {
        return `W/"${MD5(JSON.stringify({
            path: target.path,
            location: target.location,
            contentEncoding: target.contentEncoding,
            headers: target.headers,
            params: target.params,
            customParams: target.customParams,
            duration: target.duration,
            doomed: target.doomed
        })).toString()}"`
    }

    /**
     * Reads file from disk cache
     * @returns Promise<Buffer>
     */
    async read() {
        Args.check(Guid.isGuid(this.id), 'Entry identifier must be a valid uuid at this context');
        const fileName = this.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.context.getConfiguration().getSourceAt('settings/cache/rootDir');
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

    async unlink() {
        Args.check(Guid.isGuid(this.id), 'Entry identifier must be a valid uuid at this context');
        const fileName = this.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.context.getConfiguration().getSourceAt('settings/cache/rootDir');
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
     * @param {*} content 
     * @returns Promise<string>
     */
    async write(content) {
        Args.check(Guid.isGuid(this.id), 'Entry identifier must be a valid uuid at this context');
        const fileName = this.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.context.getConfiguration().getSourceAt('settings/cache/rootDir');
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
    OnRemoveCacheEntry,
    CacheEntry
}