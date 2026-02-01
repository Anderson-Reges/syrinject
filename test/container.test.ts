import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

const {
  Container,
  CircularDependencyError,
  DependencyNotFoundError,
  InvalidProviderError
} = require(path.resolve(__dirname, '..', '..', 'dist'));

test('resolve class with deps from options', () => {
  class Engine {
    kind = 'v8';
  }

  class Car {
    constructor(public engine: Engine) {}
  }

  const container = new Container();
  container.register(Engine, Engine);
  container.register(Car, Car, { deps: [Engine] });

  const car = container.resolve(Car);
  assert.equal(car.engine.kind, 'v8');
});

test('registerClass infers token by class name', () => {
  class Service {
    value = 42;
  }

  const container = new Container();
  container.registerClass(Service);

  const resolved = container.resolve('Service');
  assert.ok(resolved instanceof Service);
  assert.equal(resolved.value, 42);
});

test('singleton class provider returns same instance', () => {
  class Counter {
    count = 0;
  }

  const container = new Container();
  container.register(Counter, Counter, { singleton: true });

  const a = container.resolve(Counter);
  const b = container.resolve(Counter);

  assert.equal(a, b);
});

test('value provider returns same value', () => {
  const container = new Container();
  container.registerValue('config', { port: 3000 });

  const config = container.resolve('config');
  assert.deepEqual(config, { port: 3000 });
});

test('factory provider builds instance', () => {
  const container = new Container();
  container.registerFactory('random', () => ({ value: Math.random() }));

  const a = container.resolve('random') as { value: number };
  const b = container.resolve('random') as { value: number };

  assert.notEqual(a, b);
  assert.equal(typeof a.value, 'number');
});

test('factory provider respects singleton', () => {
  const container = new Container();
  container.registerFactory('singleton', () => ({ value: Math.random() }), { singleton: true });

  const a = container.resolve('singleton');
  const b = container.resolve('singleton');

  assert.equal(a, b);
});

test('throws DependencyNotFoundError for missing token', () => {
  const container = new Container();

  assert.throws(
    () => container.resolve('missing'),
    (err) => err instanceof DependencyNotFoundError
  );
});

test('throws CircularDependencyError when cycle exists', () => {
  class A {}
  class B {}

  const container = new Container();
  container.register(A, A, { deps: [B] });
  container.register(B, B, { deps: [A] });

  assert.throws(
    () => container.resolve(A),
    (err) => err instanceof CircularDependencyError
  );
});

test('throws InvalidProviderError for invalid provider', () => {
  const container = new Container();
  container.register('invalid', {} as any);

  assert.throws(
    () => container.resolve('invalid'),
    (err) => err instanceof InvalidProviderError
  );
});

test('has, unregister, clear work as expected', () => {
  const container = new Container();
  container.registerValue('token', 123);

  assert.equal(container.has('token'), true);
  container.unregister('token');
  assert.equal(container.has('token'), false);

  container.registerValue('a', 1);
  container.registerValue('b', 2);
  container.clear();

  assert.equal(container.has('a'), false);
  assert.equal(container.has('b'), false);
});
