import {ConfigurationBase, ConfigurationStrategy} from "@themost/common";

export declare type GetItemFunction = () => Promise<any>;

export declare interface DataCacheStrategyBase {
    add(key: string, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string): Promise<any>;
    clear(): Promise<any>;
    get(key: string): Promise<any>;
    getOrDefault(key: string, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;
}

export declare interface DataCacheFinalize extends DataCacheStrategyBase {
    finalize(): Promise<void>;
}

export declare abstract class DataCacheStrategy extends ConfigurationStrategy implements DataCacheStrategyBase {
    constructor(configuration: ConfigurationBase);
    abstract add(key: string, value: any, absoluteExpiration?: number): Promise<any>;
    abstract remove(key: string): Promise<any>;
    abstract clear(): Promise<any>;
    abstract get(key: string): Promise<any>;
    getOrDefault(key: string, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;

}
