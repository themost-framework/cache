import { DataCacheReaderWriter } from '@themost/cache';

export declare class DiskCacheReader extends DataCacheReaderWriter {

    constructor(configuration: ConfigurationBase);
    read(entry: CacheItem): Promise<Buffer>;
    write(entry: CacheItem, content: string | ArrayBufferView): Promise<void>;
    unlink(entry: CacheItem): Promise<void>;
    
}