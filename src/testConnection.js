const Crawler = require('../lib/crawler');
const c = new Crawler({
    timeout: 5000,
    retryTimeout: 1000,
    retries: 2,
    jquery: false,
    http2: true,
    debug: true
})

let options = {
    uri: 'https://nghttp2.org/httpbin/status/200',
    method: 'GET',
    headers: {
        'accept': 'application/json'
        // 'accept-encoding': 'gzip, deflate, br',
        // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
    },
    callback: (error, response, done) => {
        if(error) {
            console.error(error);
            return done();
        }

        // console.log(error.code);
        console.log(`inside callback`);
        console.log(response.body);
        return done();
    }
}

let options2 = {
    uri: 'https://nghttp2.org/httpbin/status/300',
    method: 'GET',
    headers: {
        'accept': 'application/json'
        // 'accept-encoding': 'gzip, deflate, br',
        // 'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3'
    },
    callback: (error, response, done) => {
        if(error) {
            console.error(error);
            return done();
        }

        // console.log(error.code);
        console.log(`inside callback`);
        console.log(response);
        return done();
    }
}

// c.queue(options);
c.queue(options2);