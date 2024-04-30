import { crawler } from './dist/index.js';
crawler.add({
    url: 'https://www.google.com',
    method: 'GET',
    incomingEncoding: 'utf8',
    headers: {
        'Content-Type': 'application/json'
    },
    callback: (err, res, done) => {
        if (err) {
            console.log(err);
        } else {
            console.log(res.body);
        }
        done();
    }
});