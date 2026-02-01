import type { Token } from '../types/Token';

/**
 * Error thrown when a dependency token is not registered.
 */
export class DependencyNotFoundError extends Error {
  public readonly token: Token;

  /**
   * @param token - Token that could not be resolved.
   */
  constructor(token: Token) {
    super(`Dependência não registrada: ${DependencyNotFoundError.formatToken(token)}`);
    this.name = 'DependencyNotFoundError';
    this.token = token;
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
