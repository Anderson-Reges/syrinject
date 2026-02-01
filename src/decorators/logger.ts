/**
 * Logger decorator options.
 */
export type LoggerOptions = {
  /**
   * Custom logger function. Defaults to `console.log`.
   */
  logger?: (message: string, ...args: any[]) => void;
};

/**
 * Class decorator that logs instantiation and method calls of the decorated class.
 *
 * When applied, this decorator will:
 * - Log the class name, dependencies (if any), singleton status, and constructor arguments when the class is instantiated.
 * - Intercept all public method calls and log the method name and arguments whenever a method is called.
 *
 * To display dependencies and singleton status, ensure these are set as static properties on the class
 * (e.g., `MyClass.deps`, `MyClass.singleton`).
 *
 * @example
 * ```typescript
 * // Decorate your class:
 * // Use: "@Logger()"
 * class MyService { ... }
 * ```
 * When instantiated or when myMethod is called, logs will be printed to the console.
 */
export function Logger(options: LoggerOptions = {}): ClassDecorator {
  return (target: any) => {
    const original = target;
    const log = options.logger ?? console.log;

    function construct(constructor: any, args: any[]) {
      // Read metadata when available
      const deps = constructor.deps || constructor.dependencies || [];
      const singleton = constructor.singleton || false;
      log(`[Logger] Instanciando: ${constructor.name}`);
      log(`[Logger] Dependências:`, deps.map((d: any) => d?.name || d));
      log(`[Logger] Singleton:`, singleton);
      log(`[Logger] Parâmetros:`, args);
      const instance = new constructor(...args);

      // Intercept public methods
      const proto = constructor.prototype;
      Object.getOwnPropertyNames(proto).forEach((prop) => {
        if (prop !== 'constructor' && typeof proto[prop] === 'function') {
          const originalMethod = instance[prop];
          instance[prop] = function (...methodArgs: any[]) {
            log(`[Logger] ${constructor.name}.${prop} chamado com:`, methodArgs);
            return originalMethod.apply(this, methodArgs);
          };
        }
      });

      return instance;
    }

    const newConstructor: any = function (...args: any[]) {
      return construct(original, args);
    };
    newConstructor.prototype = original.prototype;
    copyStaticProps(original, newConstructor);
    return newConstructor;
  };
}

/**
 * Copies static properties from the original constructor to the wrapped one.
 */
function copyStaticProps(source: any, target: any): void {
  Object.getOwnPropertyNames(source).forEach((key) => {
    if (key === 'prototype' || key === 'length' || key === 'name') {
      return;
    }
    const descriptor = Object.getOwnPropertyDescriptor(source, key);
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    }
  });
}
