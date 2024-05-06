// import Crawler from "./src/index.js";
// const c = new Crawler({
//     jQuery: false,
//     skipDuplicates: true,
//     callback: function (error, result) {
//         console.log("test")
//         // expect(error).to.be.null;
//         // expect(result.statusCode).to.equal(200);
//         // expect(call.isDone()).to.be.true;
//         // done();
//     },
// });

// c.queue('http://target.com');
const a = {
    a:1,
    b:2,
}
delete a.c;
delete a.a;
console.log(a)