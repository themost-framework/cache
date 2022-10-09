import { ConfigurationBase } from '@themost/common';
import { DataApplication, DefaultDataContext } from '@themost/data';

export declare class DiskCacheContext extends DefaultDataContext {
    //
}

export declare class DiskCache extends DataApplication {
    constructor(containerConfiguration: ConfigurationBase);
}
