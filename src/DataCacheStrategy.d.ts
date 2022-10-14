import {ConfigurationBase, ConfigurationStrategy} from "@themost/common";

export declare type GetItemFunction = () => Promise<any>;

export declare type CompositeCacheKey = any;

export declare interface DataCacheStrategyBase {
    add(key: string | CompositeCacheKey, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string | CompositeCacheKey): Promise<any>;
    clear(): Promise<any>;
    get(key: string | CompositeCacheKey): Promise<any>;
    getOrDefault(key: string | CompositeCacheKey, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;
}

export declare interface DataCacheFinalize extends DataCacheStrategyBase {
    finalize(): Promise<void>;
}

export declare abstract class DataCacheStrategy extends ConfigurationStrategy implements DataCacheStrategyBase {
    protected constructor(configuration: ConfigurationBase);
    abstract add(key: string | CompositeCacheKey, value: any, absoluteExpiration?: number): Promise<any>;
    abstract remove(key: string | CompositeCacheKey): Promise<any>;
    abstract clear(): Promise<any>;
    abstract get(key: string | CompositeCacheKey): Promise<any>;
    abstract has(key: string | CompositeCacheKey): Promise<boolean>;
    getOrDefault(key: string | CompositeCacheKey, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;

}
