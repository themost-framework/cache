# @themost/cache
MOST Web Framework Data Caching

@themost/cache implements the default data caching strategy that is going to be used by any [@themost](https://github.com/themost-framework) data application

Important note: This module has been separated from [@themost/data](https://github.com/themost-framework/data) even if it is the default caching strategy.

## Installation 
    npm i @themost/cache

## Configuration

`@themost/cache#DefaultDataCachingStrategy` is being registered by `@themost/data#DataConfiguration`:

    {
        "services": [
            {
                "serviceType": "@themost/cache#DataCacheStrategy",
                "strategyType": "@themost/cache#DefaultDataCacheStrategy"
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

Checkout other data caching strategies like [@themost/memcached](https://www.npmjs.com/package/@themost/memcached), [@themost/redis](https://www.npmjs.com/package/@themost/redis) etc.
