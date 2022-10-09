import { DataObject } from '@themost/data';
import { Args, Guid, TraceUtils } from '@themost/common';
import { Id, Entity, Column, Formula, ColumnDefault, Table, PostRemove } from '@themost/jspa';
// eslint-disable-next-line no-unused-vars
import {readFile, writeFile, unlink, stat} from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import {promisify} from 'util';
import * as moment from 'moment';

const readFileAsync = promisify(readFile);
const statAsync = promisify(stat);
const writeFileAsync = promisify(writeFile);
const unlinkAsync = promisify(unlink);


@Entity()
@Table({
    uniqueConstraints: {
        columnNames: [
            'path',
            'contentEncoding',
            'headers',
            'params',
            'customParams'
        ]
    }
})
class DiskCacheEntry extends DataObject {
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
        type: 'Text'
    })
    path;

    /**
     * @type {string}
     */
    @Column({
        type: 'Text'
    })
    headers;

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
    @Column({
        type: 'Text'
    })
    params;

    /**
     * @type {string}
     */
    @Column({
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
     @Formula((event) => moment(event.target.createdAt).add(event.target.duration, 'seconds').toDate())
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
     * Reads file from disk cache
     * @returns Promise<Buffer>
     */
    async read() {
        Args.check(typeof this.id === 'number', 'Entry identifier must be a valid number at this context');
        const fileName = this.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.context.getConfiguration().getSourceAt('settings/cache/rootDir');
        if (rootDir == null) {
            rootDir = '.cache/diskCache'
        }
        const finalRootDir = path.resolve(process.cwd(), rootDir);
        // ensure cache root dir
        await mkdirp(finalRootDir);
        // get file path
        const filePath = path.resolve(finalRootDir, fileDir, fileName);
        /**
         * @type {Stats}
         */
        const stats = await statAsync(path.resolve(finalRootDir, fileDir, fileName));
        // validate
        Args.check(stats.isFile, 'Entry cannot be found or is inaccessible');
        // and return
        return await readFileAsync(filePath);
    }

    async unlink() {
        Args.check(typeof this.id === 'number', 'Entry identifier must be a valid number at this context');
        const fileName = this.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.context.getConfiguration().getSourceAt('settings/cache/rootDir');
        if (rootDir == null) {
            rootDir = '.cache/diskCache'
        }
        const finalRootDir = path.resolve(process.cwd(), rootDir);
        // ensure cache root dir
        await mkdirp(finalRootDir);
        // get file path
        const filePath = path.resolve(finalRootDir, fileDir, fileName);
        try {
            /**
             * @type {Stats}
             */
            const stats = await statAsync(path.resolve(finalRootDir, fileDir, fileName));
            // validate
            Args.check(stats.isFile, 'Entry cannot be found or is inaccessible');
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
        Args.check(typeof this.id === 'number', 'Entry identifier must be a valid number at this context');
        const fileName = this.id; // e.g. 929a9730-478e-11ed-b878-0242ac120002
        const fileDir = fileName.substring(0, 1); // e.g. 9
        let rootDir = this.context.getConfiguration().getSourceAt('settings/cache/rootDir');
        if (rootDir == null) {
            rootDir = '.cache/diskCache'
        }
        const finalFileDir = path.resolve(process.cwd(), rootDir, fileDir);
        // ensure cache root dir
        await mkdirp(finalFileDir);
        // get file path
        const filePath = path.resolve(finalFileDir, fileName);
        // and write file
        return await writeFileAsync(filePath, content);
    }

    @PostRemove()
    static async onPostRemove(event) {
        try {
            const model = event.model;
            /**
             * @type {DiskCacheEntry}
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

export {
    DiskCacheEntry
}