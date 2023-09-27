/**
 * 
 * @returns type of param, a lower case string
 */
export const getType = (value: unknown): string => Object.prototype.toString.call(value).slice(8, -1).toLocaleLowerCase();
export const isNumber = (value: unknown): boolean => getType(value) === "number" && !isNaN(value as number);
