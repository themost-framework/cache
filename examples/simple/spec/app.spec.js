import { getApplication } from '../src/index';
import request from 'supertest';
describe('app', () => {
    /**
     * @type {import('express').Application}
     */
    let app;
    beforeAll(async () => {
        app = getApplication();
    });
    it('should get index', async () => {
        const response = await request(app).get('/');
        expect(response.status).toEqual(200);
    });
    
});