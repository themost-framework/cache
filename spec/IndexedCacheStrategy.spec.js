import { IndexedCacheStrategy } from '@themost/cache/platform-server';
import { getApplication } from '@themost/test';
import { ExpressDataApplication } from '@themost/express';
import { DataCacheStrategy } from '@themost/data';

describe('IndexedCachedStrategy', () => {
    /**
     * @type {import('@themost/express').ExpressDataContext}
     */
    let context;
    beforeAll(async () => {
        const container = getApplication();
        /**
         * @type {import('@themost/express').ExpressDataApplication}
         */
        const app = container.get(ExpressDataApplication.name);
        const caching = app.getConfiguration().getStrategy(DataCacheStrategy);
        if (caching && typeof caching.finalize === 'function') {
            await caching.finalize();
        }
        app.getConfiguration().useStrategy(DataCacheStrategy, IndexedCacheStrategy);
        context = app.createContext();
    });
    afterAll(async () => {
        const caching = context.application.getConfiguration().getStrategy(DataCacheStrategy);
        await caching.finalize();
        await context.finalizeAsync();
    });
    it('should try to use cache', async () => {
        const ActionStatusTypes = context.model('ActionStatusType');
        ActionStatusTypes.caching = 'always';
        const items = await ActionStatusTypes.asQueryable().getItems();
        expect(items).toBeTruthy();
    });
});
