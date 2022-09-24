
export declare interface OutputCacheAnnotation {
    duration?: number;
    location?: 'any' | 'server' | 'client' | 'serverAndClient' | 'none';
    noStore?: boolean;
    varyByContentEncoding?: string[];
    varyByHeader?: string[];
    varyByParam?: string[];
    varyByCallback?: (context: any) => Promise<string>;
}

export declare function outputCache(options: OutputCacheAnnotation): (target: any, name: string, descriptor: PropertyDescriptor) => any;
