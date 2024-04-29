import { crawler } from './src/index.ts';
const result = await crawler.send('http://www.google.com');
console.log(result)
// import got from "got";
// import fs from "fs";
// const result = await got({
//     url: "http://www.google.com"
// });
// fs.writeFileSync("result", result.body);