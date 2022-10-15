/* eslint-env node */
const { serveApplication, getApplication } = require('../src/index');
const debug = require('debug');
debug.enable('app:*');
const error = debug('app:error');
(async function() {
    try {
        await serveApplication(getApplication(), process.env.PORT, process.env.IP);
    }
    catch(err) {
        error(err);
        process.exit(1);
    }
})();


