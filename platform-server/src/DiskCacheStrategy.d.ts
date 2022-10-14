import { DataCacheStrategy, DataCacheFinalize, GetItemFunction, CompositeCacheKey } from '@themost/cache';
import {ConfigurationBase} from "@themost/common";
import { DiskCache } from './DiskCache';

export declare class DiskCacheStrategy extends DataCacheStrategy implements DataCacheFinalize {

    constructor(configuration: ConfigurationBase);
    rawCache: DiskCache;
    absoluteExpiration: number;
    add(key: string | CompositeCacheKey, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string | CompositeCacheKey): Promise<any>;
    clear(): Promise<any>;
    get(key: string | CompositeCacheKey): Promise<any>;
    has(key: string | CompositeCacheKey): Promise<boolean>;
    getOrDefault(key: string | CompositeCacheKey, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;
    finalize(): Promise<void>;

}