const options = {
    preRequest: (args) => {
        console.log(args)
        console.log("preRequest");
    }
}

options.preRequest(1, () => { });
console.log(options.preRequest.length);