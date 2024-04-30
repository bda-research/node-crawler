import { getType } from './src/lib/utils.js';
class test {
    public a: Record<number, number>;
    constructor() {
        this.a = {};
    }
}
const b = new test();
b.a[0] = 1;
console.log(Array.isArray(b.a));