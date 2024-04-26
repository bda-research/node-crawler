/**
 *
 * @returns type of param, a lower case string
 */
export const getType = (value: unknown): string =>
    Object.prototype.toString.call(value).slice(8, -1).toLocaleLowerCase();
export const isNumber = (value: unknown): boolean => getType(value) === "number" && !isNaN(value as number);
export const setDefaults = (target: Record<string, unknown>, source: Record<string, unknown>) => {
    for (const key in source) {
        if (target[key] === undefined) {
            target[key] = source[key];
        }
    }
    return target;
};
export const isValidUrl = (url: string): boolean => {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
};

export function flattenDeep<T>(array: T[]): T[];

export function flattenDeep(array: any[]): any[] {
    const result: any[] = [];
    array.forEach(element => {
        if (Array.isArray(element)) {
            result.push(...flattenDeep(element));
        } else {
            result.push(element);
        }
    });
    return result;
}
