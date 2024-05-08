// import iconv from 'iconv-lite';

// // Convert from an encoded buffer to a js string.
// const str = iconv.decode(Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f]), 'win1251');

// // Convert from a js string to an encoded buffer.
// const buf = iconv.encode("Sample input string", 'win1251');

// // Check if encoding is supported
// iconv.encodingExists("us-ascii")
// console.log(str.toString());
import got from 'got';
const data = await got()
console.log(data)