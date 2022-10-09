// eslint-disable-next-line no-unused-vars
import { ModuleLoaderStrategy } from '@themost/common';
import { DataApplication, SchemaLoaderStrategy, DefaultSchemaLoaderStrategy, DataConfigurationStrategy, DefaultDataContext } from '@themost/data';
import { DataCacheStrategy, NoCacheStrategy } from '@themost/cache';
import path from 'path';
import mkdirp from 'mkdirp';

class DiskCacheContext extends DefaultDataContext {
    constructor() {
        super()
    }
}

class DiskCache extends DataApplication {

    static get DefaultRootDir() {
        return '.cache/diskCache';
    }

    /**
     * @param {import('@themost/common').ConfigurationBase=} containerConfiguration 
     */
    constructor(containerConfiguration) {
        super(DiskCache.DefaultRootDir);
        // set jspa imports
        this.configuration.setSourceAt('settings/jspa/imports', [
            path.resolve(__dirname, './models/index')
        ]);
        // set jspa loader
        this.configuration.setSourceAt('settings/schema/loaders', [
            {
                loaderType: '@themost/jspa/platform-server#DefaultEntityLoaderStrategy'
            }
        ]);
        // add default adapter type
        this.configuration.setSourceAt('adapterTypes', [
            {
                name: 'Sqlite Data Adapter',
                invariantName: 'sqlite',
                type: '@themost/sqlite'
            }
        ]);
        const rootDir = containerConfiguration.getSourceAt('settings/cache/rootDir') || DiskCache.DefaultRootDir;
        const finalRootDir = path.resolve(process.cwd(), rootDir);
        mkdirp(finalRootDir).then(() => {
            //
        });
        this.configuration.setSourceAt('adapters', [
            {
                name: 'cache',
                default: true,
                invariantName: 'sqlite',
                options: {
                    database: path.resolve(finalRootDir, 'index.db')
                }
            }
        ]);
        // reload schema
        this.configuration.useStrategy(SchemaLoaderStrategy, DefaultSchemaLoaderStrategy);
        // reload configuration
        this.configuration.useStrategy(DataConfigurationStrategy, DataConfigurationStrategy);
        // reload configuration
        this.configuration.useStrategy(ModuleLoaderStrategy, function NodeModuleLoader() {
            this.require = (id) => require(id)
        });
        const cacheStrategy = this.configuration.getStrategy(DataCacheStrategy);
        if (cacheStrategy && typeof cacheStrategy.finalize === 'function') {
            cacheStrategy.finalize().then(() => {
                // do nothing
            });
        }
        // disable internal cache
        this.configuration.useStrategy(DataCacheStrategy, NoCacheStrategy);
    }

    createContext() {
        const context = new DiskCacheContext();
        context.getConfiguration = () => {
            return this.configuration;
        };
        return context;
    }
}

export {
    DiskCacheContext,
    DiskCache
}