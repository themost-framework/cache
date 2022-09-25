import { DataCacheStrategy, DataCacheFinalize, GetItemFunction } from '@themost/cache';
import {ConfigurationBase} from "@themost/common";

export declare class DefaultDataCacheStrategy extends DataCacheStrategy implements DataCacheFinalize {

    constructor(configuration: ConfigurationBase);
    absoluteExpiration: number;
    add(key: string, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string): Promise<any>;
    clear(): Promise<any>;
    get(key: string): Promise<any>;
    getOrDefault(key: string, getFunc: GetItemFunction, absoluteExpiration?: number): Promise<any>;
    finalize(): Promise<void>;

}
