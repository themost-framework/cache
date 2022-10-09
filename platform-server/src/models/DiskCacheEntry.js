import { DataObject } from '@themost/data';
import { Args, Guid } from '@themost/common';
import { Id, Entity, Column, Formula, ColumnDefault, Table } from '@themost/jspa';
// eslint-disable-next-line no-unused-vars
import {stats, readFile, writeFile, Stats, unlink} from 'fs';
import mkdirp from 'mkdirp';
import path from 'path';
import util from 'util';
import * as moment from 'moment';

const readFileAsync = util.promisify(readFile);
const statsAsync = util.promisify(stats);
const writeFileAsync = util.promisify(writeFile);
const unlinkAsync = util.promisify(unlink);


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
        const stats = await statsAsync(path.resolve(finalRootDir, fileDir, fileName));
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
            const stats = await statsAsync(path.resolve(finalRootDir, fileDir, fileName));
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

}

export {
    DiskCacheEntry
}