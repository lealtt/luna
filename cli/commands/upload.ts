import { promises as fs } from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { uploadApplicationEmoji, type EmojiOutput } from "../api/discord.js";
import { logger } from "#utils";

const tempDir = path.resolve(process.cwd(), ".emojis_tmp");
const validExtensions = [".png", ".jpg", ".jpeg", ".gif"];
const emojisJsonPaths = path.resolve(process.cwd(), "emojis.json");

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

  await fs.rm(tempDir, { recursive: true, force: true });
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
      const trimLength = 32 - (suffix.length + 1); // +1 for the underscore
      unique = `${base.substring(0, trimLength)}_${suffix}`;
    }

    usedNames.add(unique);
    return unique;
  };
}

export async function uploadCommand(args: string[]) {
  if (args.length === 0) {
    logger.error("no paths provided for upload");
    logger.warn("usage: pnpm cli upload <path/to/image|zip>");
    process.exit(1);
  }

  const files = await collectFilesFromInput(args);

  if (files.length === 0) {
    logger.error("no valid emoji images found");
    process.exit(1);
  }

  logger.info(`processing ${files.length} files for upload...`);

  const output: EmojiOutput = { static: {}, animated: {} };
  const sanitizeName = createNameSanitizer();

  for (const filePath of files) {
    try {
      const rawName = path.basename(filePath, path.extname(filePath));
      const name = sanitizeName(rawName);
      const image = await readImageAsDataURI(filePath);

      const uploaded = await uploadApplicationEmoji({ name, image });
      if (!uploaded) continue;

      const category = uploaded.animated ? "animated" : "static";
      output[category][uploaded.name] = uploaded.id;
    } catch (err) {
      logger.error(`error processing ${filePath}: ${String(err)}`);
    }
  }

  try {
    const existingContent = await fs.readFile(emojisJsonPaths, "utf-8").catch(() => "{}");
    const existingEmojis = JSON.parse(existingContent) as EmojiOutput;

    const mergedOutput: EmojiOutput = {
      static: { ...existingEmojis.static, ...output.static },
      animated: { ...existingEmojis.animated, ...output.animated },
    };

    await fs.writeFile(emojisJsonPaths, JSON.stringify(mergedOutput, null, 2));
    logger.success("emojis.json updated successfully");
  } catch (err) {
    logger.error(`failed to write emojis.json: ${String(err)}`);
  }

  await fs.rm(tempDir, { recursive: true, force: true });
}
