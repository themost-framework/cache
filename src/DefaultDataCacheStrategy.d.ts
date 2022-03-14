import { DataCacheStrategy, DataCacheFinalize } from './DataCacheStrategy';

export declare class DefaultDataCacheStrategy extends DataCacheStrategy implements DataCacheFinalize {

    absoluteExpiration: number;
    add(key: string, value: any, absoluteExpiration?: number): Promise<any>;
    remove(key: string): Promise<any>;
    clear(): Promise<any>;
    get(key: string): Promise<any>;
    getOrDefault(key: string, getFunc: Promise<any>, absoluteExpiration?: number): Promise<any>;
    finalize(): Promise<void>;

}