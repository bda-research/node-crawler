process.env.NODE_ENV = process.env.NODE_ENV ?? process.argv[2] ?? "production";
console.log(process.argv[2])
console.log(process.env.NODE_ENV !== "debug")