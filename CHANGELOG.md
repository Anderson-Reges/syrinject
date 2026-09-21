# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-09-21

### BREAKING CHANGES

- `registerClass(X)` now uses the class `X` itself as the token instead of the string `X.name`.
  Code doing `registerClass(Svc)` + `resolve("Svc")` must switch to `resolve(Svc)`.
  The old behavior broke `resolve(Svc)`, changed under minification and collided for same-named classes.

### Fixed

- Shorthand `register(X, X, options)` and `registerClass(X, options)` now read the class's static `deps` / `dependencies` when `options.deps` is not given. Previously the dependencies were silently ignored and the constructor received `undefined`.
- Singletons (class or factory) whose resolved value is `undefined` are now cached and created only once, instead of being rebuilt on every `resolve`.

### Docs

- README: documented the shorthand `register(token, Class, options?)` form and fixed the `registerClass` token description.

## [1.0.0]

- Initial stable release.

[2.0.0]: https://github.com/Anderson-Reges/syrinject/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/Anderson-Reges/syrinject/releases/tag/v1.0.0
