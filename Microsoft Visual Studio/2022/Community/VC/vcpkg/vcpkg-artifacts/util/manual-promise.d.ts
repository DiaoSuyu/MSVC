/**
* A manually (or externally) controlled asynchronous Promise implementation
*/
export declare class ManualPromise<T> implements Promise<T> {
    /**
      * Attaches callbacks for the resolution and/or rejection of the Promise.
      * @param onfulfilled The callback to execute when the Promise is resolved.
      * @param onrejected The callback to execute when the Promise is rejected.
      * @returns A Promise for the completion of which ever callback is executed.
      */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined): Promise<TResult1 | TResult2>;
    /**
    * Attaches a callback for only the rejection of the Promise.
    * @param onrejected The callback to execute when the Promise is rejected.
    * @returns A Promise for the completion of the callback.
    */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null | undefined): Promise<T | TResult>;
    finally(onfinally?: (() => void) | null | undefined): Promise<T>;
    readonly [Symbol.toStringTag] = "Promise";
    private p;
    /**
     * A method to manually resolve the Promise.
     */
    resolve: (value?: T | PromiseLike<T> | undefined) => void;
    /**
     *  A method to manually reject the Promise
     */
    reject: (e: any) => void;
    private state;
    /**
     * Returns true of the Promise has been Resolved or Rejected
     */
    get isCompleted(): boolean;
    /**
     * Returns true if the Promise has been Resolved.
     */
    get isResolved(): boolean;
    /**
     * Returns true if the Promise has been Rejected.
     */
    get isRejected(): boolean;
    constructor();
}
export declare class LazyPromise<T> extends ManualPromise<T> {
    private action;
    constructor(action: () => Promise<T>);
    execute(): this;
}
//# sourceMappingURL=manual-promise.d.ts.map