# @themost/cache
MOST Web Framework Data Caching

@themost/cache implements the default data caching strategy that is going to be used by any [@themost](https://github.com/themost-framework) data application

Important note: This module has been separated from [@themost/data](https://github.com/themost-framework/data) even if it exports the default caching strategy.

## Installation 
    npm i @themost/cache

## Configuration

`@themost/cache/platform-server#DefaultDataCachingStrategy` is being registered by `@themost/data#DataConfiguration`:

    {
        "services": [
            {
                "serviceType": "@themost/cache#DataCacheStrategy",
                "strategyType": "@themost/cache/platform-server#DefaultDataCacheStrategy"
            }
        ]
    }
        
Configure absolute expiration timeout by setting `absoluteExpiration` under `settings/cache` section:

    {
        "settings": {
            "cache": {
                "absoluteExpiration": 900
            }
        }
    }

This setting is going to be used by [node-cache](https://github.com/node-cache/node-cache#initialize-init) which is the caching engine initiated by `@themost/cache#DefaultDataCacheStrategy` strategy.

`@themost/cache/platform-server#IndexedCacheStrategy` is an alternative caching strategy which uses disk for caching items.

    {
        "services": [
            {
                "serviceType": "@themost/cache#DataCacheStrategy",
                "strategyType": "@themost/cache/platform-server#IndexedCacheStrategy"
            }
        ]
    }
    
Configure disk cache root under `settings/cache` section (the default value is `.cache/diskCache`):

    {
        "settings": {
            "cache": {
                "absoluteExpiration": 900,
                "rootDir": ".cache/diskCache"
            }
        }
    }

and the interval -in seconds- of validating the expiration of cached items: 

    {
        "settings": {
            "cache": {
                "absoluteExpiration": 900,
                "rootDir": ".cache/diskCache",
                "checkingPeriod": 60
            }
        }
    }

Checkout other data caching strategies like [@themost/memcached](https://www.npmjs.com/package/@themost/memcached), [@themost/redis](https://www.npmjs.com/package/@themost/redis) etc.

## Output caching

`@themost/cache#OutputCaching` enables caching mechanisms on [expressjs](https://github.com/expressjs/express) application based on pre-defined cache profiles

e.g.

    const clientCacheProfile = {
        location: 'client',
        duration: 60 * 60, // 1 hour
        varyByHeader: [
            'accept',
            'accept-encoding',
            'accept-language',
            'accept-profile'
        ],
        varyByParam: [
            '*' // use any query param
        ],
        varyByCallback: async (req) => {
            if (req.headers.authorization) {
                return `context=${MD5(req.headers.authorization).toString()}`
            }
            return null;
        } 
    }

    ...

    // setup cache
    app.use(OutputCaching.setup({
        rootDir: '.cache/indexedCache',
        absoluteExpiration: 20 * 60 // 20 minutes,
        checkingPeriod: 60 * 1000 // 1 minute
    }));

    ...

    app.use('/api/hello', OutputCaching.cache(clientCacheProfile), (req, res, next) => {
        return res.json({
            message: 'Hello World'
        });
    });

where `/api/hello` response will be cached on client side based on several parameters defined in `clientCacheProfile`.

### OutputCaching.cache(PreOutputCacheConfiguration)

Caches response based on cache profile parameters

#### duration

> int

Gets or sets the time duration in seconds during which the response is cached.

#### location

> string 

Gets or sets the output cache location.

|   |   |
|---|---|
| client | The output cache is located on the browser
| server | The output cache is located on the server
| serverAndClient | The output cache is located both on the client and server
| none | The output cache is disabled
| any | The output cache is located both on the client and server

#### varyByHeader

> string[]

Gets or sets an array of headers used to vary the cached output

#### varyByParam

> string[]

Gets or sets an array of query string params used to vary the cached output

#### varyByContentEncoding

> string

Gets or sets a content encoding which will be used to vary the cached output

#### varyByCallback

> function(): Promise&lt;string&gt;

`varyByCallback()` method may used to programmatically vary the cached output.

