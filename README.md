<p align="center">
	<img src="https://cdn.jsdelivr.net/npm/syrinject@latest/assets/Syringect-Black.png" alt="Syrinject Logo" width="500" />
</p>

<p align="center">
	<strong>A tiny, modern dependency injection container for TypeScript.</strong>
</p>

<hr>

## Overview

Syrinject is a lightweight Dependency Injection (DI) container built for TypeScript. It focuses on clarity and explicitness while remaining flexible enough for small apps and larger codebases. You can register providers and resolve dependencies by token.

## Features

- ✅ Simple DI container API.
- ✅ Typed tokens for safe resolution.
- ✅ Class, value, and factory providers.
- ✅ Singleton or transient lifetimes.
- ✅ Optional logging decorator for class usage.
- ✅ Clear error messages for invalid providers, missing dependencies, and circular graphs.

## Installation

```bash
npm install syrinject
```

## Quick Start

```ts
import { Container } from "syrinject";

// Tokens can be string, symbol, or class constructors
const LoggerToken = "Logger";

interface Logger {
	log(message: string): void;
}

class ConsoleLogger implements Logger {
	log(message: string) {
		console.log(message);
	}
}

const container = new Container();

// Register a token with a class provider
container.register(LoggerToken, {
	useClass: ConsoleLogger,
	singleton: true,
});

const logger = container.resolve<Logger>(LoggerToken);
logger.log("Hello from Syrinject!");
```

## Core Concepts

### Tokens

Tokens are identifiers for dependencies. Use a `string`, `symbol`, or a class constructor.

```ts
export interface HttpClient {
	get(url: string): Promise<string>;
}

export const HttpClientToken = "HttpClient";
```

### Providers

Providers define how a dependency is created.

#### Class Provider

```ts
container.register(HttpClientToken, {
	useClass: FetchHttpClient,
	singleton: false,
	deps: [LoggerToken],
});
```

#### Value Provider

```ts
container.register(HttpClientToken, {
	useValue: { get: async (url) => fetch(url).then((r) => r.text()) },
});
```

#### Factory Provider

```ts
container.register(HttpClientToken, {
	useFactory: (c) => new FetchHttpClient(c.resolve(LoggerToken)),
	singleton: true,
});
```

### Lifetimes

- `singleton: true` creates and caches a single instance.
- `singleton: false` creates a new instance on each resolve (default).

### Decorator: Logger

Syrinject includes a `Logger` decorator that logs instantiation and public method calls.
To show dependencies and singleton status in logs, set static `deps` (or `dependencies`) and `singleton` on the class.

```ts
import { Container, Logger } from "syrinject";

const LoggerToken = "Logger";

interface LoggerService {
	log(message: string): void;
}

class ConsoleLogger implements LoggerService {
	log(message: string) {
		console.log(message);
	}
}

@Logger()
class UserService {
	static deps = [LoggerToken];
	static singleton = true;

	constructor(private readonly logger: LoggerService) {}

	createUser(name: string) {
		this.logger.log(`Creating user: ${name}`);
	}
}

const container = new Container();
container.register(LoggerToken, { useClass: ConsoleLogger, singleton: true });
container.register(UserService, { useClass: UserService, deps: UserService.deps, singleton: true });

const service = container.resolve(UserService);
service.createUser("Ada");
```

## Container API

### `register(token, provider)`

Registers a provider for a token.

### `resolve(token)`

Resolves an instance for the given token.

### `unregister(token)`

Removes a token from the container.

### `clear()`

Clears all registrations.

### `has(token)`

Checks if a token is registered.

### `registerClass(...)`

Registers a class provider. You can pass a token + class, or only a class.
When only a class is provided, the token will be the class name (string).

### `registerValue(token, value)`

Registers a value provider.

### `registerFactory(token, factory, options?)`

Registers a factory provider.

## Errors

Syrinject throws descriptive errors to simplify debugging:

- `DependencyNotFoundError` when a token is not registered.
- `InvalidProviderError` when a provider is malformed.
- `CircularDependencyError` when a dependency graph loops.

## TypeScript Configuration

If you use the `Logger` decorator, enable decorators in `tsconfig.json`:

```json
{
	"compilerOptions": {
		"experimentalDecorators": true,
		"emitDecoratorMetadata": false
	}
}
```

## License

MIT