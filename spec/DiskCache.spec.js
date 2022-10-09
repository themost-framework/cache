import { ConfigurationBase } from '@themost/common';
import { DiskCacheStrategy, DiskCache } from '@themost/cache/platform-server';

describe('DataCacheStrategy', () => {

    /**
     * @type {DiskCacheStrategy}
     */
    let service;
    beforeEach(() => {
        service = new DiskCacheStrategy(new ConfigurationBase('.'));
    })

    afterEach(async () => {
        await service.finalize();
    });

    it('should try to create instance', async () => {
        const service1 = new DiskCacheStrategy(new ConfigurationBase('.'));
        expect(service1).toBeTruthy();
        expect(service1.rawCache).toBeInstanceOf(DiskCache);
        await service1.finalize();
    });

    it('should try to get item', async () => {
        expect(service).toBeTruthy();
        const item = await service.get('/api/Users/?$filter=enabled eq true');
        expect(item).toBeFalsy();
    });
});
