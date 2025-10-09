import type { CommandContext, Middleware, NextFunction } from "./index.js";

/**
 * Executes a chain of middlewares and the final command logic for any context.
 * This function is now generic to correctly handle specific middleware types.
 * @param context The interaction or message object.
 * @param middlewares The array of middlewares to execute.
 * @param finalHandler The final function to call (the command's run function).
 */
export async function runMiddlewareChain<T extends CommandContext>(
  context: T,
  middlewares: Middleware<T>[],
  finalHandler: () => Promise<void>,
) {
  let index = -1;

  const next: NextFunction = async () => {
    index++;
    if (index < middlewares.length) {
      await middlewares[index](context, next);
    } else {
      await finalHandler();
    }
  };

  await next();
}
