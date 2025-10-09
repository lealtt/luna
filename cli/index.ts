import { uploadCommand } from "./commands/upload.js";
import { listCommand } from "./commands/list.js";
import { deleteCommand } from "./commands/delete.js";
import { generateJsonCommand } from "./commands/generateJson.js";
import { helpCommand } from "./commands/help.js";
import { logger } from "#utils";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || "help";
  const commandArgs = args.slice(1);

  switch (command) {
    case "upload":
      await uploadCommand(commandArgs);
      break;
    case "list":
      await listCommand();
      break;
    case "delete":
      await deleteCommand(commandArgs);
      break;
    case "generate-json":
      await generateJsonCommand();
      break;
    case "help":
      helpCommand();
      break;
    default:
      logger.error(`unknown command: "${command}"`);
      helpCommand();
      process.exit(1);
  }

  if (command !== "help") {
    logger.info("cli process finished.");
  }
}

main().catch((err) => {
  logger.error(`an unexpected error occurred: ${String(err)}`);
  process.exit(1);
});
