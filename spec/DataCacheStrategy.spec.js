import { AbstractClassError, ConfigurationBase } from '@themost/common';
import { DataCacheStrategy } from '../src/index';

describe('DataCacheStrategy', () => {
    it('should try to create instance', () => {
        expect(() => {
            // noinspection JSValidateTypes
            new DataCacheStrategy(new ConfigurationBase('.'))
        }).toThrowError(new AbstractClassError())
    });
});
