import path from "node:path";
import { glob } from "glob";
import { fileURLToPath, pathToFileURL } from "node:url";
import { logger } from "#utils";
import { componentRegistry } from "#discord/registry";

/**
 * Dynamically loads all modules (commands, events, tasks) from the application's source tree.
 * This allows for a clean separation of concerns and avoids manual imports.
 * @param baseURL The base URL of the entry point file (import.meta.url).
 */
export async function loadAllModules(baseURL: string): Promise<void> {
  const entryPath = fileURLToPath(baseURL);
  // Determine if running in a production environment (dist) or development (src)
  const isProduction = entryPath.includes("/dist/");
  const projectRoot = path.resolve(path.dirname(entryPath), "..");

  const scanDir = isProduction ? "dist" : "src";
  const extension = isProduction ? "js" : "ts";

  const bootstrapFilePath = fileURLToPath(import.meta.url);
  const rootPosix = projectRoot.replace(/\\/g, "/");

  // Define patterns to find all relevant module files
  const patterns = [
    `${rootPosix}/${scanDir}/discord/**/*.${extension}`,
    `${rootPosix}/${scanDir}/tasks/**/*.${extension}`,
  ];

  const files = await glob(patterns, {
    // Ignore the bootstrap file itself to prevent circular dependencies
    ignore: [bootstrapFilePath.replace(/\\/g, "/")],
  });

  // Import all found files in parallel to speed up the loading process
  await Promise.all(files.map(async (file) => import(pathToFileURL(file).href)));

  logger.component(`Loaded ${componentRegistry.size} components.`);
}
