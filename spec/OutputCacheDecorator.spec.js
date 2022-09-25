import {  ConfigurationBase } from '@themost/common';
import {DataCacheStrategy, outputCache} from '@themost/cache';
import express from 'express';
import {DefaultDataCacheStrategy} from '@themost/cache/platform-server';

@outputCache({
    duration: 30
})
function helloAction(req, res) {
    return res.json({
        message: 'Hello World!'
    });
}

describe('OutputCache', () => {
    it('should creat app', async () => {
        const app = express();
        const configuration = new ConfigurationBase();
        configuration.useStrategy(DataCacheStrategy, DefaultDataCacheStrategy);
        app.use(function createContext(request, response, next) {
            request.context = {
                request,
                response,
                configuration
            }
           return next();
        });
        app.use('hello', helloAction);
        expect(helloAction.outputCache).toBeTruthy();

    });
});
