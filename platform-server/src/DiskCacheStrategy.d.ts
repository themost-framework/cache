import { DataCacheStrategy, DataCacheFinalize, GetItemFunction, CompositeCacheKey } from '@themost/cache';
import {ConfigurationBase} from "@themost/common";
import { IndexedCache } from './IndexedCache';

export declare class DiskCacheStrategy extends DataCacheStrategy implements DataCacheFinalize {

    constructor(configuration: ConfigurationBase);
    rawCache: IndexedCache;
    absoluteExpiration: number;
    add(key: string | CompositeCacheKey, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string | CompositeCacheKey): Promise<any>;
    clear(): Promise<any>;
    get(key: string | CompositeCacheKey): Promise<any>;
    has(key: string | CompositeCacheKey): Promise<CompositeCacheKey>;
    getOrDefault(key: string | CompositeCacheKey, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;
    finalize(): Promise<void>;

}