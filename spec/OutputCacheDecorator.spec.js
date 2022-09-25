import {outputCache} from '@themost/cache';


class IndexController {
    @outputCache({
        duration: 30
    })
    hello() {
        return {
            message: 'Hello World!'
        };
    }
}



describe('OutputCache', () => {
    it('should use OutputCacheDecorator', async () => {
        /**
         * @type {OutputCacheAnnotation|*}
         */
        const helloAction = new IndexController().hello;
        expect(helloAction.outputCache).toBeTruthy();
        expect(helloAction.outputCache.duration).toEqual(30);
    });
});
