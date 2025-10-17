import { logger, Queue } from "#utils";
import { glob } from "glob";
import { minimatch } from "minimatch";
import { pathToFileURL } from "node:url";
import { isSafePath } from "./bootstrap.helpers.js";
import type { ModuleCache } from "./bootstrap.types.js";

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
    logger.warn(`Cycle detected: ${normalizedPath}`);
    moduleCache.failed.add(normalizedPath);
    return;
  }

  moduleCache.processing.add(normalizedPath);

  try {
    await import(pathToFileURL(file).href);
    moduleCache.loaded.add(normalizedPath);
  } catch (error) {
    moduleCache.failed.add(normalizedPath);
    logger.error(`${file}:`, error);
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
  ];
  return ignored.some((pattern) => minimatch(file, pattern));
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
      if (!queue.isEmpty()) {
        await new Promise((r) => setTimeout(r, 10));
      }
    }
  }
}

async function processQueueWithQueue(queue: Queue<string>): Promise<void> {
  const CONCURRENCY = 8;
  const BATCH_SIZE = 20;
  const workers = Array.from({ length: CONCURRENCY }, () => processWorker(queue, BATCH_SIZE));
  await Promise.all(workers);
}

export async function loadAllModules(projectRoot: string, isProduction: boolean): Promise<void> {
  const scanDir = isProduction ? "dist" : "src";
  const rootPosix = projectRoot.replace(/\\/g, "/");
  const scanPath = `${rootPosix}/${scanDir}/discord`;

  const allFiles = await glob(`${scanPath}/**/*.{${isProduction ? "js,mjs" : "ts,js,mjs"}}`);
  const validFiles = allFiles.filter(
    (file) => isSafePath(file, projectRoot) && !isIgnoredFile(file),
  );

  const moduleQueue = new Queue<string>(validFiles.length);
  validFiles.forEach((file) => moduleQueue.enqueue(file));

  await processQueueWithQueue(moduleQueue);
}
