import { logger } from "#utils";
import { glob } from "glob";
import { minimatch } from "minimatch";
import { pathToFileURL } from "node:url";
import { isSafePath } from "./bootstrap.helpers.js";
import type { ModuleCache } from "./bootstrap.types.js";
import { kfeat } from "@lealt/kaori";
type Queue<T> = ReturnType<typeof kfeat.queue.create<T>>;

const moduleCache: ModuleCache = {
  loaded: new Set(),
  failed: new Set(),
  processing: new Set(),
};

async function loadModuleSafe(file: string): Promise<void> {
  const normalizedPath = normalizePath(file);

  if (moduleCache.loaded.has(normalizedPath)) return;
  if (moduleCache.failed.has(normalizedPath)) return;
  if (moduleCache.processing.has(normalizedPath)) {
    if (!file.includes("/dist/")) {
      logger.warn(`Cycle detected: ${normalizedPath}`);
    }
    moduleCache.failed.add(normalizedPath);
    return;
  }

  moduleCache.processing.add(normalizedPath);

  try {
    await import(pathToFileURL(file).href);
    moduleCache.loaded.add(normalizedPath);
  } catch (error) {
    moduleCache.failed.add(normalizedPath);
    logger.error(`Failed to import module ${normalizedPath}:`, error);
  } finally {
    moduleCache.processing.delete(normalizedPath);
  }
}

function isIgnoredFile(file: string): boolean {
  const ignored = [
    "**/*.d.ts",
    "**/*.test.{ts,js}",
    "**/*.spec.{ts,js}",
    "**/*.config.{ts,js}",
    "**/node_modules/**",
    "**/.git/**",
    "**/index.{ts,js}",
    "**/locales/**",
    "**/translate/**",
  ];
  const normalizedFile = normalizePath(file);
  return ignored.some((pattern) => minimatch(normalizedFile, pattern, { dot: true }));
}

function normalizePath(file: string): string {
  return file.replace(/\\/g, "/");
}

async function processWorker(queue: Queue<string>, batchSize: number): Promise<void> {
  while (!queue.isEmpty()) {
    const batch: string[] = [];

    for (let i = 0; i < batchSize && !queue.isEmpty(); i++) {
      const file = queue.dequeue();
      if (file) batch.push(file);
    }

    if (batch.length > 0) {
      await Promise.all(batch.map(loadModuleSafe));
    }
  }
}

async function processQueueWithQueue(queue: Queue<string>): Promise<void> {
  const concurrency = Math.max(1, (await import("node:os")).cpus().length - 1);
  const batchSize = 20;
  const workers = Array.from({ length: concurrency }, () => processWorker(queue, batchSize));
  await Promise.all(workers);
}

export async function loadAllModules(projectRoot: string, isProduction: boolean): Promise<void> {
  const rootPosix = normalizePath(projectRoot);
  const fileExtensions = isProduction ? "js,mjs" : "ts,js,mjs";

  const srcBaseDir = `${rootPosix}/src`;
  const distBaseDir = `${rootPosix}/dist`;

  const discordScanPath = isProduction ? `${distBaseDir}/discord` : `${srcBaseDir}/discord`;

  const discordFiles = await glob(`${discordScanPath}/**/*.{${fileExtensions}}`, {
    absolute: true,
    ignore: ["**/node_modules/**"],
  });

  const allFiles = [...discordFiles];

  const validFiles = allFiles.filter(
    (file) => isSafePath(file, projectRoot) && !isIgnoredFile(file),
  );

  const moduleQueue = kfeat.queue.create<string>();
  validFiles.forEach((file) => moduleQueue.enqueue(file));

  await processQueueWithQueue(moduleQueue);

  if (moduleCache.failed.size > 0) {
    logger.warn(`Failed to load ${moduleCache.failed.size} modules.`);
  }
}
