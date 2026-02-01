import type { Token } from '../types/Token';

/**
 * Error thrown when a circular dependency is detected.
 */
export class CircularDependencyError extends Error {
  public readonly path: Token[];

  /**
   * @param path - Dependency resolution path that caused the cycle.
   */
  constructor(path: Token[]) {
    super(`Dependência circular detectada: ${CircularDependencyError.formatPath(path)}`);
    this.name = 'CircularDependencyError';
    this.path = path;
  }

  private static formatPath(path: Token[]): string {
    return path.map(CircularDependencyError.formatToken).join(' -> ');
  }

  private static formatToken(token: Token): string {
    if (typeof token === 'string') {
      return token;
    }
    if (typeof token === 'symbol') {
      return token.toString();
    }
    return token?.name ?? 'UnknownToken';
  }
}
