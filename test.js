import { crawler } from './src/index.ts';
const result = await crawler.add({
    url: "http://www.google.com",
    method: "GET",
    incomingEncoding: "utf8",
    callback: (err, res, done) => {
        console.log(response.body)
    }
});
console.log(result)
// import got from "got";
// import fs from "fs";
// const result = await got({
//     url: "http://www.google.com"
// });
// fs.writeFileSync("result", result.body);
// let a = 5
// console.log(a++ % 6)