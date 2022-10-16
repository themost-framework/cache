import { DataObject } from '@themost/data';

export declare class DiskCacheEntry extends DataObject {
    id?: string;
    path?: string;
    location?: 'any' | 'none' | 'server' | 'client' | 'serverAndClient';
    contentEncoding?: string;
    headers?: string;
    params?: string;
    customParams?: string;
    duration?: number;
    createdAt?: Date;
    expiredAt?: Date;
    modifiedAt?: Date;
    entityTag?: Date;
    read(): Promise<Buffer>;
    write(content: string | ArrayBufferView): Promise<void>;
}