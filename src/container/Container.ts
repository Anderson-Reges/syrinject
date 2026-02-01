import type { ClassProvider, FactoryProvider, Provider, ValueProvider } from '../types/Provider';
import type { Newable, Token } from '../types/Token';
import { CircularDependencyError } from '../errors/CircularDependencyError';
import { DependencyNotFoundError } from '../errors/DependencyNotFoundError';
import { InvalidProviderError } from '../errors/InvalidProviderError';

/**
 * Internal registry entry.
 * Stores provider configuration and, when applicable, the cached instance.
 */
type RegistryEntry<T = any> = {
  provider: Provider<T>;
  value?: T;
};

/**
 * A simple and lightweight dependency injection container.
 *
 * The `Container` class provides methods to register and resolve dependencies using unique tokens.
 * Tokens can be class constructors, strings, or symbols, allowing flexible and type-safe dependency management.
 *
 * @example
 * // Create a new container instance
 * const container = new Container();
 *
 * // Register a class dependency
 * class MyService {}
 * container.register(MyService, MyService, { singleton: true });
 *
 * // Register a value with a string token
 * container.registerValue('config', { port: 3000 });
 *
 * // Resolve dependencies
 * const service = container.resolve(MyService);
 * const config = container.resolve<{ port: number }>('config');
 */
export class Container {
  private registry: Map<Token, RegistryEntry> = new Map()

  /**
   * Registers a dependency with a class constructor and optional dependencies.
   *
   * @typeParam T - The dependency type.
   * @param token - Unique token associated with the dependency.
   * @param useClass - Class constructor used to create instances.
   * @param options - Optional configuration.
   * @param options.singleton - Whether to cache a single instance.
   * @param options.deps - Optional array of dependency tokens.
   */
  register<T>(
    token: Token<T>,
    useClass: Newable<T>,
    options?: { singleton?: boolean; deps?: Token[] }
  ): void;
  register<T>(token: Token<T>, provider: Provider<T>): void;
  register<T>(
    token: Token<T>,
    providerOrClass: Provider<T> | Newable<T>,
    options: { singleton?: boolean; deps?: Token[] } = {}
  ): void {
    const provider = this.normalizeProvider(providerOrClass, options);
    this.registry.set(token, { provider });
  }

  /**
   * Registers a class provider (syntactic sugar for `register` with a class).
   *
   * @typeParam T - The dependency type.
   * @param token - Unique token associated with the dependency.
   * @param useClass - Class constructor used to create instances.
   * @param options - Optional configuration.
   * @param options.singleton - Whether to cache a single instance.
   * @param options.deps - Optional array of dependency tokens.
   */
  registerClass<T>(
    token: Token<T>,
    useClass: Newable<T>,
    options?: { singleton?: boolean; deps?: Token[] }
  ): void;
  registerClass<T>(
    useClass: Newable<T>,
    options?: { singleton?: boolean; deps?: Token[] }
  ): void;
  registerClass<T>(
    tokenOrClass: Token<T> | Newable<T>,
    useClassOrOptions?: Newable<T> | { singleton?: boolean; deps?: Token[] },
    options: { singleton?: boolean; deps?: Token[] } = {}
  ): void {
    if (typeof tokenOrClass === 'function') {
      const inferredToken = tokenOrClass.name;
      this.register(inferredToken, tokenOrClass, (useClassOrOptions as { singleton?: boolean; deps?: Token[] }) ?? {});
      return;
    }

    this.register(tokenOrClass, useClassOrOptions as Newable<T>, options);
  }

  /**
   * Registers a value provider.
   *
   * @typeParam T - The dependency type.
   * @param token - Unique token associated with the dependency.
   * @param useValue - Value to be returned on resolve.
   */
  registerValue<T>(token: Token<T>, useValue: T): void {
    this.register(token, { useValue });
  }

  /**
   * Registers a factory provider.
   *
   * @typeParam T - The dependency type.
   * @param token - Unique token associated with the dependency.
   * @param useFactory - Factory function that builds the dependency.
   * @param options - Optional configuration.
   * @param options.singleton - Whether to cache a single instance.
   */
  registerFactory<T>(
    token: Token<T>,
    useFactory: (container: Container) => T,
    options: { singleton?: boolean } = {}
  ): void {
    this.register(token, { useFactory, singleton: options.singleton ?? false });
  }

  /**
   * Unregisters a token.
   *
   * @param token - Token to remove from the registry.
   */
  unregister(token: Token): void {
    this.registry.delete(token);
  }

  /**
   * Clears all registrations and cached singletons.
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Checks if a token is registered.
   *
   * @param token - Token to check.
   * @returns True if the token is registered, otherwise false.
   */
  has(token: Token): boolean {
    return this.registry.has(token);
  }

  /**
   * Resolves a dependency by its token.
   *
   * @typeParam T - Expected dependency type.
   * @param token - Token associated with the dependency.
   * @returns The resolved dependency instance or value.
   * @throws DependencyNotFoundError when the token is not registered.
   * @throws CircularDependencyError when a dependency cycle is detected.
   */
  resolve<T>(token: Token<T>): T {
    return this.resolveInternal(token, []);
  }

  private resolveInternal<T>(token: Token<T>, resolving: Token[]): T {
    if (resolving.includes(token)) {
      throw new CircularDependencyError([...resolving, token]);
    }

    const entry = this.registry.get(token);

    if (!entry) {
      throw new DependencyNotFoundError(token);
    }

    const provider = entry.provider;

    if (this.isValueProvider(provider)) {
      return provider.useValue as T;
    }

    if (this.isClassProvider(provider)) {
      if (provider.singleton && entry.value !== undefined) {
        return entry.value as T;
      }

      const deps = provider.deps ?? this.getDepsFromClass(provider.useClass);
      const instance = this.createInstance(provider.useClass, deps, [...resolving, token]);

      if (provider.singleton) {
        entry.value = instance;
      }

      return instance;
    }

    if (this.isFactoryProvider(provider)) {
      if (provider.singleton && entry.value !== undefined) {
        return entry.value as T;
      }

      const instance = provider.useFactory(this);

      if (provider.singleton) {
        entry.value = instance;
      }

      return instance;
    }

    throw new InvalidProviderError(token);
  }

  private createInstance<T>(ClassRef: Newable<T>, deps: Token[] = [], resolving: Token[] = []): T {
    const resolvedDeps = deps.map(dep => this.resolveInternal(dep, resolving));
    return new ClassRef(...resolvedDeps);
  }

  private normalizeProvider<T>(
    providerOrClass: Provider<T> | Newable<T>,
    options: { singleton?: boolean; deps?: Token[] }
  ): Provider<T> {
    if (this.isProvider(providerOrClass)) {
      return providerOrClass;
    }

    return {
      useClass: providerOrClass,
      singleton: options.singleton ?? false,
      deps: options.deps ?? []
    };
  }

  private isProvider<T>(value: Provider<T> | Newable<T>): value is Provider<T> {
    return typeof value === 'object' && value !== null;
  }

  private isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
    return 'useClass' in provider;
  }

  private isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
    return 'useValue' in provider;
  }

  private isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
    return 'useFactory' in provider;
  }

  private getDepsFromClass<T>(useClass: Newable<T>): Token[] {
    const classRef = useClass as unknown as { deps?: Token[]; dependencies?: Token[] };
    return classRef.deps ?? classRef.dependencies ?? [];
  }
}
