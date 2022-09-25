import {  ConfigurationBase } from '@themost/common';
import { DefaultDataCacheStrategy } from '@themost/cache/platform-server';
import {DataCacheStrategy} from '@themost/cache';

describe('DefaultDataCacheStrategy', () => {
    it('should try to create instance', async () => {
        const strategy = new DefaultDataCacheStrategy(new ConfigurationBase('.'));
        expect(strategy).toBeInstanceOf(DefaultDataCacheStrategy);
        await strategy.finalize();
    });
    it('should use default cache as strategy', async () => {
        const configuration = new ConfigurationBase('.');
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        const cache = configuration.getStrategy(DataCacheStrategy);
        expect(cache).toBeInstanceOf(DefaultDataCacheStrategy);
        await cache.finalize();
    });

    it('should set expiration', async () => {
        const configuration = new ConfigurationBase('.');
        configuration.setSourceAt('settings/cache/absoluteExpiration', 600);
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        const cache = configuration.getStrategy(DataCacheStrategy);
        expect(cache.absoluteExpiration).toBe(600);
        await cache.finalize();
    });

    it('should get item', async () => {
        const configuration = new ConfigurationBase('.');
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        const cache = configuration.getStrategy(DataCacheStrategy);
        await cache.add('cache-item-key', {
            id: 1001
        });
        const item = await cache.get('cache-item-key');
        expect(item).toEqual({
            id: 1001
        });
        await cache.finalize();
    });

    it('should remove item', async () => {
        const configuration = new ConfigurationBase('.');
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        const cache = configuration.getStrategy(DataCacheStrategy);
        await cache.add('cache-item-key', {
            id: 1001
        });
        let item = await cache.get('cache-item-key');
        expect(item).toEqual({
            id: 1001
        });
        await cache.remove('cache-item-key');
        item = await cache.get('cache-item-key');
        expect(item).toBeUndefined();
        await cache.finalize();
    });

    it('should get item or add', async () => {
        const configuration = new ConfigurationBase('.');
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        const cache = configuration.getStrategy(DataCacheStrategy);
        let item = await cache.get('cache-item-key');
        expect(item).toBeFalsy();
        await cache.getOrDefault('cache-item-key', async () => {
            return {
                id: 1001
            }
        });
        item = await cache.get('cache-item-key');
        expect(item).toEqual({
            id: 1001
        });
        await cache.finalize();
    });

    it('should clear items', async () => {
        const configuration = new ConfigurationBase('.');
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        const cache = configuration.getStrategy(DataCacheStrategy);
        await cache.getOrDefault('cache-item-key', async () => {
            return {
                id: 1001
            }
        });
        await cache.clear();
        let item = await cache.get('cache-item-key');
        expect(item).toBeUndefined();
        await cache.finalize();
    });

});
