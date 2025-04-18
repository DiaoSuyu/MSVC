/**
 * Creates an intersection object from two source objects.
 *
 * Typescript nicely supports defining intersection types (ie, Foo & Bar )
 * But if you have two seperate *instances*, and you want to use them as the implementation
 * of that intersection, the language doesn't solve that for you.
 *
 * This function creates a strongly typed proxy type around the two objects,
 * and returns members for the intersection of them.
 *
 * This works well for properties and member functions the same.
 *
 * Members in the primary object will take precedence over members in the secondary object if names conflict.
 *
 * This can also be used to "add" arbitrary members to an existing type (without mutating the original object)
 *
 * @example
 * const combined = intersect( new Foo(), { test: () => { console.debug('testing'); } });
 * combined.test(); // writes out 'testing' to console
 *
 * @param primary primary object - members from this will have precedence.
 * @param secondary secondary object - members from this will be used if primary does not have a member
 */
export declare function intersect<T extends object, T2 extends object>(primary: T, secondary: T2, filters?: string[]): T & T2;
//# sourceMappingURL=intersect.d.ts.map