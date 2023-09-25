export const getType = (value: any): string => Object.prototype.toString.call(value).slice(8, -1).toLocaleLowerCase();
export const isNumber = (value: any): boolean => getType(value) === "number" && !isNaN(value);
