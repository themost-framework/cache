
export declare interface OutputCacheConfiguration {
    duration?: number;
    location?: 'any' | 'server' | 'client' | 'serverAndClient' | 'none';
    noStore?: boolean;
    varyByContentEncoding?: string[];
    varyByHeader?: string[];
    varyByParam?: string[];
    varyByCallback?: (context: any) => Promise<string>;
}

export declare interface OutputCacheAnnotation {
    outputCache?: OutputCacheConfiguration
}

export declare function outputCache(options: OutputCacheConfiguration): (target: any, name: string, descriptor: PropertyDescriptor) => any;
