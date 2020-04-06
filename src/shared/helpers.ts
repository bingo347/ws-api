export type Store<T> = {
    (): T;
    (updater: (value: T) => T): Store<T>;
};
export function createStore<T>(initValue: T) {
    // eslint-disable-next-line immutable/no-let
    let value = initValue;
    function store(): T;
    function store(updater: (value: T) => T): Store<T>;
    function store(updater?: (value: T) => T): T | Store<T> {
        return (updater
            // eslint-disable-next-line fp/no-mutation
            ? (value = updater(value))
            : value
        );
    }
    return store;
}

export const noop = () => void 0;
