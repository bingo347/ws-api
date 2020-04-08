export * from '../shared/helpers';

export function without<T extends Record<string | number, any>>(key: keyof T, obj: T): T {
    const keys = Object.keys(obj).filter(k => k !== key);
    return keys.reduce((acc, k) => ({
        ...acc,
        [k]: obj[k]
    }), {} as T);
}