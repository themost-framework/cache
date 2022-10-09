// eslint-disable-next-line no-unused-vars
import { ConfigurationBase } from '@themost/common';
import { DataApplication, SchemaLoaderStrategy, DefaultSchemaLoaderStrategy, DataConfigurationStrategy, ModuleLoaderStrategy, DefaultDataContext } from '@themost/data';
import path from 'path';

class DiskCacheContext extends DefaultDataContext {
    constructor() {
        super()
    }
}

class DiskCache extends DataApplication {

    static get defaultRootDir() {
        return './cache/diskCache';
    }

    /**
     * @param {ConfigurationBase=} containerConfiguration 
     */
    constructor(containerConfiguration) {
        super();
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
        let rootDir = this.defaultRootDir;
        if (containerConfiguration != null) {
            rootDir = containerConfiguration.getSourceAt('settings/cache/rootDir') || this.defaultRootDir;
        }
        this.configuration.setSourceAt('adapters', [
            {
                name: 'cache',
                default: true,
                invariantName: 'sqlite',
                options: {
                    database: path.resolve(process.cwd(), rootDir, 'index')
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