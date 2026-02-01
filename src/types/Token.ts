/**
 * Constructor signature for class-based providers.
 */
export type Newable<T = any> = new (...args: any[]) => T;

/**
 * Token used to register and resolve dependencies.
 * Can be a class constructor, string, or symbol.
 */
export type Token<T = any> = string | symbol | Newable<T>;
