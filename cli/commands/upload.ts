import { promises as fs } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { uploadApplicationEmoji, type EmojiOutput, EmojiOutputSchema } from "../api/discord.js";
import { logger } from "#utils";
import { kfeat } from "@lealt/kaori";

const tempDir = path.resolve(process.cwd(), ".emojis_tmp");
const validExtensions = [".png", ".jpg", ".jpeg", ".gif"];
const emojisJsonPaths = path.resolve(process.cwd(), "emojis.json");
const rateLimitDelay = kfeat.timer.create(2).sec();

interface UploadTask {
  name: string;
  image: string;
  filePath: string;
}

type UploadQueue = ReturnType<typeof kfeat.queue.create<UploadTask>>;

async function processUploadQueue(queue: UploadQueue, output: EmojiOutput) {
  if (queue.isEmpty()) {
    logger.info("Upload queue is empty. Writing to emojis.json...");
    try {
      const existingContent = await fs.readFile(emojisJsonPaths, "utf-8").catch(() => "{}");
      const parsedJson = JSON.parse(existingContent);

      const validation = EmojiOutputSchema.safeParse(parsedJson);
      const existingEmojis = validation.success ? validation.data : { static: {}, animated: {} };

      const mergedOutput: EmojiOutput = {
        static: { ...existingEmojis.static, ...output.static },
        animated: { ...existingEmojis.animated, ...output.animated },
      };

      await fs.writeFile(emojisJsonPaths, JSON.stringify(mergedOutput, null, 2));
      logger.success("emojis.json updated successfully.");
    } catch (err) {
      logger.error(`failed to write emojis.json: ${String(err)}`);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
    return;
  }

  const task = queue.dequeue();
  if (!task) {
    logger.warn("Attempted to dequeue from an empty queue unexpectedly.");
    return;
  }

  try {
    const uploaded = await uploadApplicationEmoji({ name: task.name, image: task.image });
    if (uploaded) {
      const category = uploaded.animated ? "animated" : "static";
      output[category][uploaded.name] = uploaded.id;
    }
  } catch (err) {
    logger.error(`error processing ${task.filePath}: ${String(err)}`);
  }

  setTimeout(() => processUploadQueue(queue, output), rateLimitDelay);
}

async function readImageAsDataURI(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeType =
    ext === ".gif" ? "image/gif" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}

async function extractZip(filePath: string): Promise<string[]> {
  logger.info(`extracting zip: ${path.basename(filePath)}`);
  const zip = new AdmZip(filePath);

  await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(tempDir, { recursive: true });

  zip.extractAllTo(tempDir, true);

  const files: string[] = [];

  async function collectFiles(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await collectFiles(fullPath);
      } else if (validExtensions.includes(path.extname(entry.name).toLowerCase())) {
        files.push(fullPath);
      }
    }
  }

  await collectFiles(tempDir);
  logger.info(`found ${files.length} emoji files inside zip`);
  return files;
}

async function collectFilesFromInput(inputs: string[]): Promise<string[]> {
  const allFiles: string[] = [];
  for (const input of inputs) {
    try {
      const absPath = path.resolve(input);
      const stat = await fs.stat(absPath);

      if (stat.isDirectory()) {
        const entries = await fs.readdir(absPath, { withFileTypes: true });
        for (const entry of entries) {
          const entryPath = path.join(absPath, entry.name);
          if (entry.isFile() && validExtensions.includes(path.extname(entry.name).toLowerCase())) {
            allFiles.push(entryPath);
          }
        }
      } else if (stat.isFile()) {
        if (path.extname(absPath).toLowerCase() === ".zip") {
          const extracted = await extractZip(absPath);
          allFiles.push(...extracted);
        } else if (validExtensions.includes(path.extname(absPath).toLowerCase())) {
          allFiles.push(absPath);
        } else {
          logger.warn(`ignored unsupported file: ${path.basename(absPath)}`);
        }
      }
    } catch (err) {
      logger.error(`Error processing input path "${input}": ${String(err)}`);
    }
  }
  return allFiles;
}

function createNameSanitizer() {
  const usedNames = new Set<string>();

  const toCamelCase = (s: string): string => {
    return s.replace(/_([a-z0-9])/g, (g) => g[1].toUpperCase());
  };

  return (raw: string): string => {
    const sanitized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    let base = toCamelCase(sanitized);

    if (base.length < 2) base = "emoji";
    if (base.length > 32) base = base.substring(0, 32);

    let unique = base;
    let counter = 1;
    while (usedNames.has(unique)) {
      const suffix = `${counter++}`;
      const trimLength = 32 - suffix.length;
      unique = `${base.substring(0, trimLength)}${suffix}`;
      if (unique.length < 2) unique = `e${suffix}`;
    }

    usedNames.add(unique);
    return unique;
  };
}

export async function uploadCommand(paths: string[]) {
  if (paths.length === 0) {
    logger.error("no paths provided for upload");
    logger.warn("usage: pnpm cli upload <path/to/image|zip>");
    process.exit(1);
  }

  const files = await collectFilesFromInput(paths);

  if (files.length === 0) {
    logger.error("no valid emoji images found");
    process.exit(1);
  }

  logger.info(`preparing ${files.length} files for upload queue...`);

  const uploadQueue = kfeat.queue.create<UploadTask>();
  const sanitizeName = createNameSanitizer();

  for (const filePath of files) {
    try {
      const rawName = path.basename(filePath, path.extname(filePath));
      const name = sanitizeName(rawName);
      const image = await readImageAsDataURI(filePath);
      uploadQueue.enqueue({ name, image, filePath });
    } catch (err) {
      logger.error(`error preparing ${filePath}: ${String(err)}`);
    }
  }

  if (uploadQueue.isEmpty()) {
    logger.error("no files were successfully prepared for upload.");
    return;
  }

  logger.info(`starting upload of ${uploadQueue.size} emojis...`);
  processUploadQueue(uploadQueue, { static: {}, animated: {} });
}
