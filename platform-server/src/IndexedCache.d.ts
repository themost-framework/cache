import { ConfigurationBase } from '@themost/common';
import { DataApplication, DefaultDataContext } from '@themost/data';

export declare class IndexedCacheContext extends DefaultDataContext {
    //
}

export declare class IndexedCache extends DataApplication implements CacheReaderWriter {
    constructor(containerConfiguration: ConfigurationBase);
}