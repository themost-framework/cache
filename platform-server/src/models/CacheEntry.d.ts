import { DataObject } from '@themost/data';
import { CacheItem } from '@themost/cache';

export declare class CacheEntry extends DataObject implements CacheItem {

    static inferEntityTag(target: CacheEntry);

    id?: string;
    path?: string;
    location?: 'any' | 'none' | 'server' | 'client' | 'serverAndClient';
    contentEncoding?: string;
    headers?: string;
    params?: string;
    customParams?: string;
    duration?: number;
    doomed?: boolean;
    createdAt?: Date;
    expiredAt?: Date;
    modifiedAt?: Date;
    entityTag?: Date;
    read(): Promise<Buffer>;
    write(content: string | ArrayBufferView): Promise<void>;
    unlink(): Promise<void>;
}