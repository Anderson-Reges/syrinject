import type { Token } from '../types/Token';

/**
 * Error thrown when a token is registered with an invalid provider configuration.
 */
export class InvalidProviderError extends Error {
  public readonly token: Token;

  /**
   * @param token - Token with invalid provider configuration.
   */
  constructor(token: Token) {
    super(`Provider inválido para o token: ${InvalidProviderError.formatToken(token)}`);
    this.name = 'InvalidProviderError';
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
