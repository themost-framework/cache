import { DataCacheStrategy, DataObject } from '@themost/data';
import { Args, Guid, TraceUtils } from '@themost/common';
import { Id, Entity, Column, Formula, ColumnDefault, Table, PostRemove, EntityListeners } from '@themost/jspa';
import { MD5 } from 'crypto-js';

const moment = require('moment');

class ContainerConfiguration {

}

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
     * Reads content from cache
     * @returns Promise<Buffer>
     */
    async read() {
        /**
         * @type {import('@themost/cache').CacheReader}
         */
         const cache = this.context.getConfiguration().getStrategy(ContainerConfiguration).getStrategy(DataCacheStrategy);
         Args.check(typeof cache.read === 'function', new Error('Application cache strategy does not support reading cache.'));
         return cache.read(this);
    }

    /**
     * Unlinks content from cache
     * @returns Promise<void>
     */
    async unlink() {
        /**
         * @type {import('@themost/cache').CacheWriter}
         */
         const cache = this.context.getConfiguration().getStrategy(ContainerConfiguration).getStrategy(DataCacheStrategy);
         Args.check(typeof cache.unlink === 'function', new Error('Application cache strategy does not support writing cache.'));
         return cache.unlink(this);
    }

    /**
     * Writes content to cache
     * @param {*} content 
     * @returns Promise<void>
     */
    async write(content) {
        /**
         * @type {import('@themost/cache').CacheWriter}
         */
        const cache = this.context.getConfiguration().getStrategy(ContainerConfiguration).getStrategy(DataCacheStrategy);
        Args.check(typeof cache.write === 'function', new Error('Application cache strategy does not support writing cache.'));
        return cache.write(this, content);
    }

}

export {
    OnRemoveCacheEntry,
    CacheEntry
}