import { DataObject } from '@themost/data';

export declare class CacheEntry extends DataObject {

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