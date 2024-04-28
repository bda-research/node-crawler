import { crawler } from './src/index.js';
const result = await crawler.send('http://www.google.com');
console.log(result)