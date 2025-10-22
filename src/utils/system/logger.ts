import chalk, { type ChalkInstance } from "chalk";

/**
 * Returns the current time formatted as HH:MM:SS.
 */
function getTimestamp() {
  return `[${new Date().toLocaleTimeString("en-US", { hour12: false })}]`;
}

/**
 * Creates a styled logger function.
 * @param color The chalk color function to use.
 * @param prefix The Nerd Font prefix to display.
 * @param logFunction The console function to use (e.g., console.log).
 */
function createLogger(
  color: ChalkInstance,
  prefix: string,
  logFunction: (...args: any[]) => void = console.log,
) {
  return (message: any, ...args: any[]) => {
    logFunction(color(`${prefix} ${getTimestamp()}`), chalk.gray("-> "), message, ...args);
  };
}

/**
 * The custom logger object using chalk and Nerd Fonts.
 */
export const logger = {
  // Standard log functions
  log: createLogger(chalk.gray, " "), // nf-fa-envelope
  info: createLogger(chalk.blue, " "), // nf-fa-info_circle
  success: createLogger(chalk.green, " "), // nf-fa-check
  warn: createLogger(chalk.yellow, " "), // nf-fa-warning
  error: createLogger(chalk.red, " "), // nf-fa-times_circle
  debug: createLogger(chalk.magenta, " "), // nf-fa-bug

  // Custom log functions
  database: createLogger(chalk.cyan, " "), // nf-fa-database
  command: createLogger(chalk.magenta, " "), // nf-dev-terminal
  event: createLogger(chalk.green, " "), // nf-fa-bell
  component: createLogger(chalk.yellow, " "), // nf-fa-puzzle_piece
  task: createLogger(chalk.blue, " "), // nf-fa-clock_o
  api: createLogger(chalk.gray, " "), // nf-fa-cloud
  module: createLogger(chalk.gray, " "), // nf-oct-package
};
