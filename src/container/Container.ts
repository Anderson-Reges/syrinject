/**
 * Represents a unique identifier for a dependency in the container.
 * 
 * A `Token` can be:
 * - A class constructor (used for class-based dependency injection)
 * - A string (used as a named token)
 * - A symbol (used for unique, non-colliding tokens)
 *
 * @typeParam T - The type of the dependency associated with the token.
 */
type Token<T = any> = new (...args: any[]) => T | string | symbol

/**
 * Internal registry map type for storing dependency information.
 * Maps tokens to their corresponding class constructors, instances, singleton status, and dependencies.
 * @internal
 * @see Container
 * @see Token
 * @typeParam Token - The type of the token used as the key in the map.
 * @typeParam T - The type of the dependency associated with the token.
 * @returns A map where each key is a Token and the value is an object containing:
 *          - useClass: The class constructor
 *         - value: The instance of the dependency (if created)
 *         - singleton: A boolean indicating if the dependency is a singleton
 *         - deps: An array of Tokens representing the dependencies of the class
 */
type RegistryMap = Map<Token, { useClass: new (...args: any[]) => any; value: any; singleton: boolean; deps: Token[] }>

/**
 * A simple and lightweight dependency injection container.
 * 
 * The `Container` class provides methods to register and resolve dependencies using unique tokens.
 * Tokens can be class constructors, strings, or symbols, allowing for flexible and type-safe dependency management.
 *
 * @example
 * // Create a new container instance
 * const container = new Container();
 * 
 * // Register a class dependency
 * class MyService {}
 * container.register(MyService, new MyService());
 * 
 * // Register a value with a string token
 * container.register('config', { port: 3000 });
 * 
 * // Resolve dependencies
 * const service = container.resolve(MyService);
 * const config = container.resolve<{ port: number }>('config');
 */
export class Container {
  private registry: RegistryMap = new Map()
  private singletons: RegistryMap = new Map()

  /**
   * Registers a dependency with a class constructor and optional dependencies.
   * 
   * @typeParam T - The type of the dependency.
   * @param token - The unique token to associate with the dependency.
   * @param useClass - The class constructor to use for creating instances.
   * @param options - Optional configuration object.
   * @param options.singleton - If true, the instance will be singleton.
   * @param options.deps - Optional array of tokens for dependencies.
   */
  register<T>(
    token: Token<T>,
    useClass: new (...args: any[]) => T,
    options: { singleton?: boolean; deps?: Token[] } = {}
  ): void {
    this.registry.set(token, {
      useClass,
      value: null,
      singleton: options.singleton ?? false,
      deps: options.deps ?? []
    });
  }

  /**
   * Resolves a dependency by its token.
   * 
   * @typeParam T - The expected type of the dependency.
   * @param token - The token associated with the dependency.
   * @returns The resolved dependency instance or value.
   * @throws If the dependency is not found for the given token.
   */
  resolve<T>(token: Token<T>): T {
    const entry = this.registry.get(token);

    if (!entry) {
      throw new Error('Dependência não registrada');
    }

    if (entry.singleton) {
      if (!this.singletons.has(token)) {
        this.singletons.set(token, {
          ...entry,
          value: this.createInstance(entry.useClass, entry.deps)
        });
      }
      return this.singletons.get(token)!.value;
    }

    return this.createInstance(entry.useClass, entry.deps);
  }

  private createInstance<T>(ClassRef: new (...args: any[]) => T, deps: Token[] = []): T {
    const resolvedDeps = deps.map(dep => this.resolve(dep));
    return new ClassRef(...resolvedDeps);
  }
}
