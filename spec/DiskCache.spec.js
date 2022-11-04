import { ConfigurationBase } from '@themost/common';
import { IndexedCacheStrategy, IndexedCache, CacheEntry } from '@themost/cache/platform-server';
import { DataCacheStrategy } from '@themost/cache';
import { QueryExpression } from '@themost/query';

describe('DataCacheStrategy', () => {

    /**
     * @type {IndexedCacheStrategy}
     */
    let service;
    beforeEach(() => {
        const configuration = new ConfigurationBase('.');
        configuration.useStrategy(DataCacheStrategy, IndexedCacheStrategy);
        service = configuration.getStrategy(DataCacheStrategy);
    })

    afterEach(async () => {
        await service.finalize();
    });

    it('should try to create instance', async () => {
        const service1 = new IndexedCacheStrategy(new ConfigurationBase('.'));
        expect(service1).toBeTruthy();
        expect(service1.rawCache).toBeInstanceOf(IndexedCache);
        await service1.finalize();
    });

    it('should try to get item', async () => {
        expect(service).toBeTruthy();
        const item = await service.get('/api/Users/?$filter=enabled eq true');
        expect(item).toBeFalsy();
    });

    it('should try to set item', async () => {
        expect(service).toBeTruthy();
        const key = '/api/Users/?$filter=enabled eq true';
        await service.add(key, [
            {
                name: 'user1'
            },
            {
                name: 'user2'
            }
        ]);
        const item = await service.get(key);
        expect(item).toBeTruthy();
        await service.remove(key);
    });

    it('should try to remove item', async () => {
        expect(service).toBeTruthy();
        const key = '/api/Users/';
        await service.add(key, [
            {
                name: 'user1'
            },
            {
                name: 'user2'
            }
        ]);
        let item = await service.get(key);
        expect(item).toBeTruthy();
        await service.remove(key);
        item = await service.get(key);
        expect(item).toBeFalsy();
    });

    it('should check items', async () => {
        for (let index = 0; index < 10; index++) {
            await service.add(`/api/Users/${index}`, {
                name: `user${index}`
            }, 30 * 60);
        }
        const context = service.rawCache.createContext();
        const cached = await context.model(CacheEntry).where('path').equal('/api/Users/4').getItem();
        expect(cached).toBeTruthy();
        await context.db.executeAsync(
            new QueryExpression().update(context.model(CacheEntry).sourceAdapter).set(
                {
                    expiredAt: new Date()
                }
            ).where('path').equal('/api/Users/4')
        );
        await service.onCheck();
        const deleted = await context.model(CacheEntry).where('path').equal('/api/Users/4').getItem();
        expect(deleted).toBeFalsy();
        await context.finalize();
        
    });
});
