import { ConfigurationBase } from '@themost/common';
import { DiskCacheStrategy, DiskCache } from '@themost/cache/platform-server';

describe('DataCacheStrategy', () => {
    it('should try to create instance', async () => {
        const service = new DiskCacheStrategy(new ConfigurationBase('.'));
        expect(service).toBeTruthy();
        expect(service.rawCache).toBeInstanceOf(DiskCache);
        await service.finalize();
    });

    it('should try to get item', async () => {
        /**
         * @type {DiskCacheStrategy}
         */
        const service = new DiskCacheStrategy(new ConfigurationBase('.'));
        expect(service).toBeTruthy();
        const item = await service.get('/api/Users/?$filter=enabled eq true');
        expect(item).toBeFalsy();
        await service.finalize();
    });
});
