/**
 * @returns type of param, a lower case string
 */
export const getType = (value: unknown): string =>
    Object.prototype.toString.call(value).slice(8, -1).toLocaleLowerCase();

export const isNumber = (value: unknown): boolean => getType(value) === "number" && !isNaN(value as number);

export const isFunction = (value: unknown): boolean => getType(value) === "function";

export const isBoolean = (value: unknown): boolean => getType(value) === "boolean";
/**
 * @param target
 * @param source
 * @returns target with source's properties added if they don't exist in target
 * @description
 * This function is used to set default values for an object.
 * Add properties from source to target if they don't exist in target.
 */
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
    } catch (_e) {
        return false;
    }
};

// export function flattenDeep<T>(array: T[]): T[];
/**
 *
 * @param array
 * @returns a flattened array
 * @description
 * Flattens an array of arrays recursively.
 *
 */
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

export function pick<T extends object, K extends keyof T>(target: T, keys: (keyof T)[]): Pick<T, K> {
    const result: any = {};
    keys.forEach(key => {
        if (target[key] !== undefined) {
            result[key] = target[key];
        }
    });
    return result;
}
/**
 * 
 * @param obj
 * @returns a cleaned object
 * @description
 * Removes all undefined and null values from an object, this will be done recursively.
 * But it will not remove empty objects. (i.e. {})
 */
export const cleanObject = (obj: Record<string, unknown>): Record<string, unknown> => {
    Object.keys(obj).forEach(key => {
        if (getType(obj[key]) === "object") {
            obj[key] = cleanObject(obj[key] as Record<string, unknown>);
        }
        if (obj[key] === undefined || obj[key] === null) {
            delete obj[key];
        }
    });
    return obj;
};
/**
 * 
 * @param obj 
 * @returns an object with all keys in lowercase
 * @description
 * Converts all keys of an object to lowercase. 
 */
export const lowerObjectKeys = (obj: Record<string, unknown>): Record<string, unknown> => {
    const result: Record<string, unknown> = {};
    Object.keys(obj).forEach(key => {
        result[key.toLowerCase()] = obj[key];
    });
    return result;
};