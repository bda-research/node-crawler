export const testCbAsync = (test, description, assertions) => {
    test(description, async t => {
        await new Promise(resolve => {
            // eslint-disable-next-linse @typescript-eslint/no-explicit-any
            t.end = () => {
                resolve(undefined);
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assertions(t);
        });
    });
};
export const testCbSync = (test, description, assertions) => {
    test.serial(description, async t => {
        await new Promise(resolve => {
            // eslint-disable-next-linse @typescript-eslint/no-explicit-any
            t.end = () => {
                resolve(undefined);
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            assertions(t);
        });
    });
};

// @todo: add async test version
export const testCb = testCbSync;
