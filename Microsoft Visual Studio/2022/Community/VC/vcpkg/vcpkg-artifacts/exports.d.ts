import { Queue } from './util/promise';
/** This adds the expected declarations to the Array type. */
declare global {
    interface Array<T> {
        /**
        * Returns the elements of an array that meet the condition specified in a callback function.
        * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
        */
        where<S extends T>(callbackfn: (value: T, index: number, array: Array<T>) => value is S): Array<S>;
        /**
         * Returns the elements of an array that meet the condition specified in a callback function.
         * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array.
         */
        where(callbackfn: (value: T, index: number, array: Array<T>) => unknown): Array<T>;
        /**
        * Calls a defined callback function on each element of an array, and returns an array that contains the results.
        */
        select<U>(callbackfn: (value: T, index: number, array: Array<T>) => U): Array<U>;
        /**
         * Determines whether the specified callback function returns true for any element of an array.
         * @param callbackfn A function that accepts up to three arguments. The some method calls
         * the callbackfn function for each element in the array until the callbackfn returns a value
         * which is coercible to the Boolean value true, or until the end of the array.
         * @param thisArg An object to which the this keyword can refer in the callbackfn function.
         * If thisArg is omitted, undefined is used as the this value.
         */
        any(callbackfn: (value: T, index: number, array: Array<T>) => unknown, thisArg?: any): boolean;
        /**
         * Determines whether all the members of an array satisfy the specified test.
         * @param callbackfn A function that accepts up to three arguments. The every method calls
         * the callbackfn function for each element in the array until the callbackfn returns a value
         * which is coercible to the Boolean value false, or until the end of the array.
         * @param thisArg An object to which the this keyword can refer in the callbackfn function.
         * If thisArg is omitted, undefined is used as the this value.
         */
        all(callbackfn: (value: T, index: number, array: Array<T>) => unknown, thisArg?: any): boolean;
        /**
           * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
           * @param start The zero-based location in the array from which to start removing elements.
           * @param deleteCount The number of elements to remove.
           * @param items Elements to insert into the array in place of the deleted elements.
           */
        insert(start: number, ...items: Array<T>): Array<T>;
        /**
          * Removes elements from an array returning the deleted elements.
          * @param start The zero-based location in the array from which to start removing elements.
          * @param deleteCount The number of elements to remove.
          */
        remove(start: number, deleteCount?: number): Array<T>;
        /**
         * Iterates on a collection to create a Queue that will throttle
         * the async operation 'fn' to a reasonable degree of parallelism.
         * @param fn the async Fn to call on each
         */
        forEachAsync<S>(fn: (v: T) => Promise<S>): Queue;
        selectMany<U>(callbackfn: (value: T, index: number, array: Array<T>) => U): Array<U extends ReadonlyArray<infer InnerArr> ? InnerArr : U>;
        groupByMap<TKey, TValue>(keySelector: (each: T) => TKey, selector: (each: T) => TValue): Map<TKey, Array<TValue>>;
        groupBy<TValue>(keySelector: (each: T) => string, selector: (each: T) => TValue): {
            [s: string]: Array<TValue>;
        };
        count(predicate: (each: T) => Promise<boolean>): Promise<number>;
        count(predicate: (each: T) => boolean): number;
        readonly last: T | undefined;
        readonly first: T | undefined;
    }
}
declare global {
    interface Map<K, V> {
        getOrDefault(key: K, defaultValue: V | (() => V)): V;
    }
}
//# sourceMappingURL=exports.d.ts.map