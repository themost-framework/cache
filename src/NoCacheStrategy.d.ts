import { ConfigurationBase, ConfigurationStrategy } from '@themost/common';
import { CompositeCacheKey, DataCacheStrategyBase, GetItemFunction } from './DataCacheStrategy';

export declare class NoCacheStrategy extends ConfigurationStrategy implements DataCacheStrategyBase {

    constructor(configuration: ConfigurationBase);
    absoluteExpiration: number;
    add(key: string | CompositeCacheKey, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string | CompositeCacheKey): Promise<any>;
    clear(): Promise<any>;
    get(key: string | CompositeCacheKey): Promise<any>;
    getOrDefault(key: string | CompositeCacheKey, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;
    has(key: string | CompositeCacheKey): Promise<CompositeCacheKey>;
    finalize(): Promise<void>;
    
}