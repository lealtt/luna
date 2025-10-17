import { onBotEvent } from "#discord/hooks";
import { logger } from "#utils";

onBotEvent(
  "paginator:button:beforeExecute",
  ({ data }) => {
    logger.debug(
      `[PAGINATOR][${data.paginatorId}] Button "${data.direction}" pressed by ${data.interaction.user.id}`,
    );
  },
  { name: "monitor-paginator-button", silent: true },
);

onBotEvent(
  "paginator:menu:beforeExecute",
  ({ data }) => {
    logger.debug(
      `[PAGINATOR][${data.paginatorId}] Menu option "${data.selectedValue}" selected by ${data.interaction.user.id}`,
    );
  },
  { name: "monitor-paginator-menu", silent: true },
);

onBotEvent(
  "paginator:button:error",
  ({ data }) => {
    const error = data.error as Error;
    logger.error(`[PAGINATOR][${data.paginatorId}] Button Error: ${error.message}`);
  },
  { name: "monitor-paginator-button-error", silent: true },
);

onBotEvent(
  "paginator:menu:error",
  ({ data }) => {
    const error = data.error as Error;
    logger.error(`[PAGINATOR][${data.paginatorId}] Menu Error: ${error.message}`);
  },
  { name: "monitor-paginator-menu-error", silent: true },
);
