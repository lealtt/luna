import { Command } from "commander";
import { uploadCommand } from "./commands/upload.js";
import { listCommand } from "./commands/list.js";
import { deleteCommand } from "./commands/delete.js";
import { generateJsonCommand } from "./commands/generateJson.js";
import { logger } from "#utils";

const program = new Command();

program
  .name("luna-cli")
  .description("A CLI to manage Luna bot's application emojis")
  .version("1.0.0");

program
  .command("list")
  .description("Lists all current application emojis in a JSON array format")
  .action(listCommand);

program
  .command("upload")
  .description("Uploads images or .zip archives as new application emojis")
  .argument("<paths...>", "Paths to the files or directories to upload")
  .action(uploadCommand);

program
  .command("delete")
  .description("Deletes specific emojis by ID, or all emojis if no IDs are given")
  .argument("[emoji_ids...]", "Optional list of emoji IDs to delete")
  .action(deleteCommand);

program
  .command("generate-json")
  .description("Generates an `emojis.json` file in the project root from live emoji data")
  .action(generateJsonCommand);

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  logger.error(`An unexpected error occurred: ${String(err)}`);
  process.exit(1);
});
