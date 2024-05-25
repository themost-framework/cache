import { ConfigurationStrategy } from '@themost/common';
import { CacheItem } from './DataCacheStrategy';

export declare interface CacheReader {
    read(entry: CacheItem): Promise<Buffer>;
}

export declare interface CacheWriter {
    write(entry: CacheItem, content: string | ArrayBufferView): Promise<void>;
    unlink(entry: CacheItem): Promise<void>;
}

export declare interface CacheReaderWriter extends CacheReader, CacheWriter {
    read(entry: CacheItem): Promise<Buffer>;
    write(entry: CacheItem, content: string | ArrayBufferView): Promise<void>;
    unlink(entry: CacheItem): Promise<void>;
}

export declare abstract class DataCacheReaderWriter extends ConfigurationStrategy implements CacheReaderWriter {
    abstract read(entry: CacheItem): Promise<Buffer>;
    abstract write(entry: CacheItem, content: string | ArrayBufferView): Promise<void>;
    abstract unlink(entry: CacheItem): Promise<void>;
} 
