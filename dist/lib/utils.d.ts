/**
 * @returns type of param, a lower case string
 */
export declare const getType: (value: unknown) => string;
export declare const isNumber: (value: unknown) => boolean;
export declare const isFunction: (value: unknown) => boolean;
export declare const isBoolean: (value: unknown) => boolean;
/**
 * @param target
 * @param source
 * @returns target with source's properties added if they don't exist in target
 * @description
 * This function is used to set default values for an object.
 * Add properties from source to target if they don't exist in target.
 */
export declare const setDefaults: (target: Record<string, unknown>, source: Record<string, unknown>) => Record<string, unknown>;
export declare const isValidUrl: (url: string) => boolean;
export declare function flattenDeep<T>(array: T[]): T[];
export declare function pick<T extends Object, K extends keyof T>(target: T, keys: (keyof T)[]): Pick<T, K>;
/**
 *
 * @param obj
 * @returns a cleaned object
 * @description
 * Removes all undefined and null values from an object, this will be done recursively.
 * But it will not remove empty objects. (i.e. {})
 */
export declare const cleanObject: (obj: Record<string, unknown>) => Record<string, unknown>;
/**
 *
 * @param obj
 * @returns an object with all keys in lowercase
 * @description
 * Converts all keys of an object to lowercase.
 */
export declare const lowerObjectKeys: (obj: Record<string, unknown>) => Record<string, unknown>;
//# sourceMappingURL=utils.d.ts.map