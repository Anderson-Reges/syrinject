/**
 * Class decorator that logs instantiation and method calls of the decorated class.
 *
 * When applied, this decorator will:
 * - Log the class name, dependencies (if any), singleton status, and constructor arguments when the class is instantiated.
 * - Intercept all public method calls and log the method name and arguments whenever a method is called.
 *
 * To display dependencies and singleton status, ensure these are set as static properties on the class (e.g., `MyClass.deps`, `MyClass.singleton`).
*
* @example
* ```typescript
* // Decorate your class:
* // Use: "@Logger()"
* class MyService { ... }
* ```
 * When instantiated or when myMethod is called, logs will be printed to the console.
 */
export function Logger(): ClassDecorator {
  return (target: any) => {
    const original = target;

    function construct(constructor: any, args: any[]) {
      // Recupera metadados se existirem
      const deps = constructor.deps || constructor.dependencies || [];
      const singleton = constructor.singleton || false;
      console.log(`[Logger] Instanciando: ${constructor.name}`);
      console.log(`[Logger] Dependências:`, deps.map((d: any) => d?.name || d));
      console.log(`[Logger] Singleton:`, singleton);
      console.log(`[Logger] Parâmetros:`, args);
      const instance = new constructor(...args);

      // Intercepta métodos públicos
      const proto = constructor.prototype;
      Object.getOwnPropertyNames(proto).forEach((prop) => {
        if (prop !== 'constructor' && typeof proto[prop] === 'function') {
          const originalMethod = instance[prop];
          instance[prop] = function (...methodArgs: any[]) {
            console.log(`[Logger] ${constructor.name}.${prop} chamado com:`, methodArgs);
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
    return newConstructor;
  };
}
