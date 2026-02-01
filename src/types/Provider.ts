import type { Container } from '../container/Container';
import type { Newable, Token } from './Token';

/**
 * Provider that resolves dependencies by instantiating a class.
 */
export type ClassProvider<T = any> = {
  /** Class constructor used to create instances. */
  useClass: Newable<T>;
  /** Optional dependency tokens for constructor injection. */
  deps?: Token[];
  /** Whether to cache a single instance. */
  singleton?: boolean;
};

/**
 * Provider that returns a pre-built value.
 */
export type ValueProvider<T = any> = {
  useValue: T;
};

/**
 * Provider that resolves dependencies via a factory function.
 */
export type FactoryProvider<T = any> = {
  useFactory: (container: Container) => T;
  /** Whether to cache a single instance. */
  singleton?: boolean;
};

/**
 * Union of all supported providers.
 */
export type Provider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T>;
