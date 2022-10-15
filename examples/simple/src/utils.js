 import http from 'http';
 import debug from 'debug';
 
 const log = debug('app:log');
 // normalize a port into a number, string, or false.
 function normalizePort(val) {
     let port = parseInt(val, 10);
     if (isNaN(port)) {
         // named pipe
         return val;
     }
     if (port >= 0) {
         // port number
         return port;
     }
     return false;
 }
 // noinspection JSUnusedGlobalSymbols
 /**
  *
  * @param {Application} app
  * @param {*=} port
  * @param {*=} host
  * @return Promise<Server>
  */
 function serveApplication(app, port, host) {
 
     return new Promise((resolve, reject) => {
         // get port from environment
         let _port = normalizePort(port);
         // get bind address.
         let _host = host || '127.0.0.1';
         // noinspection JSUnresolvedFunction
         let server = http.createServer(app);
         // listen on provided port, on all network interfaces.
         server.on('error', err => {
             return reject(err);
             });
         server.on('close', () => {
             log('Stopping http server from accepting new connections.');
         });
         server.on('listening', () => {
             let addr = server.address();
             // eslint-disable-next-line no-console
             log(`Http server starts listening on http://${addr.address}:${addr.port}`);
             return resolve(server);
         });
         server.listen(_port, _host);
     });
 }
 
 // noinspection JSUnusedGlobalSymbols
 /**
  * @param {Server} server
  * @return {string}
  */
 function getServerAddress(server) {
     // noinspection JSUnresolvedFunction
     const addressInfo = server.address();
     return `http://${addressInfo.address}:${addressInfo.port}/`;
 }
 
 export {
    serveApplication,
    getServerAddress
 }