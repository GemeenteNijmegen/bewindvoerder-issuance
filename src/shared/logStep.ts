import { Logger } from '@aws-lambda-powertools/logger';

/**
 * Logt precies welke stap faalt, met de SDK-specifieke type/type_description-velden die
 * Ver.ID- en OIDC-fouten vaak meegeven. Zonder dit zie je bij een fout alleen de generieke
 * catch-all bovenaan de lambda, niet welke aanroep het was.
 */
export async function logStep<T>(
  logger: Logger,
  name: string,
  context: Record<string, unknown>,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logger.error(`${name} mislukt`, {
      ...context,
      name: err instanceof Error ? err.name : undefined,
      errorMessage: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      type: (err as { type?: string }).type,
      typeDescription: (err as { type_description?: string }).type_description,
    });
    throw err;
  }
}
