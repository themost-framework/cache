import { DataObject } from '@themost/data';

export declare class DiskCacheEntry extends DataObject {
    id?: number;
    path?: string;
    contentEncoding?: string;
    headers?: string;
    params?: string;
    customParams?: string;
    duration?: number;
    createdAt?: Date;
    expiredAt?: Date;
    modifiedAt?: Date;
    read(): Promise<Buffer>;
    write(content: string | ArrayBufferView): Promise<void>;
}