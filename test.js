// const crawler = require('./dist/index.js');
// const result = crawler.add({
//     url: "http://www.google.com",
//     method: "GET",
//     incomingEncoding: "utf8",
//     callback: (err, res, done) => {
//         console.log(response.body)
//     }
// });
// console.log(result)
// import got from "got";
// import fs from "fs";
// const result = await got({
//     url: "http://www.google.com"
// });
// fs.writeFileSync("result", result.body);
// let a = 5
// console.log(a++ % 6)
const a = {
    a: {
        q1 : 1,
        q2 : 2,
        q3 : 3
    },
    b: {
        q1 : 1,
        q2 : 2,
        q3 : 3
    }
}
for(const value of Object.values(a)){
    value.q1++;
    value.q2 = 0;
    delete value.q3;
}
console.log(a)