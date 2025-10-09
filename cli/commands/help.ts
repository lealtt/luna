import chalk from "chalk";

const commands = [
  {
    name: "upload",
    usage: "<path/to/image|zip> ...",
    description: "Uploads images or zip archives as new application emojis.",
  },
  {
    name: "list",
    description: "Lists all current application emojis in a JSON array format.",
  },
  {
    name: "delete",
    usage: "[emoji_id] ...",
    description: "Deletes specific emojis by ID, or all emojis if no IDs are given.",
  },
  {
    name: "generate-json",
    description: "Generates an `emojis.json` file in the project root from live emoji data.",
  },
  {
    name: "help",
    description: "Displays this help message.",
  },
];

export function helpCommand() {
  console.log(chalk.bold.blue("\n 🌙 Luna Emoji CLI Helper"));
  console.log("\nUsage: " + chalk.cyan("pnpm cli <command> [arguments]\n"));
  console.log(chalk.yellow("Available Commands:"));

  commands.forEach((cmd) => {
    const usage = cmd.usage ? ` ${cmd.usage}` : "";
    console.log(`  ${chalk.green(cmd.name.padEnd(15))} ${cmd.description}`);
    console.log(chalk.gray(`    └─ Usage: pnpm cli ${cmd.name}${usage}\n`));
  });
}
