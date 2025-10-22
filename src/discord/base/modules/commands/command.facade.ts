import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  Locale,
  PermissionsBitField,
  REST,
  Routes,
  type APIApplicationCommand,
  type Client,
  type RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";
import { logger } from "#utils";
import type { AnyCommand, CommandOption } from "./command.types.js";
import { getLocalizations, type I18nKey, nimbus } from "#translate";

export class DiscordApiFacade {
  private readonly rest: REST;

  public constructor(token: string) {
    this.rest = new REST().setToken(token);
  }

  private areObjectsEqual(obj1: any, obj2: any, depth = 0): boolean {
    if (depth > 50) return false;
    if (obj1 === obj2) return true;

    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== typeof obj2) return false;

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) return false;
      return obj1.every((item, i) => this.areObjectsEqual(item, obj2[i], depth + 1));
    }

    if (typeof obj1 !== "object" || typeof obj2 !== "object") {
      return String(obj1) === String(obj2);
    }

    const keys1 = Object.keys(obj1).sort();
    const keys2 = Object.keys(obj2).sort();

    if (keys1.length !== keys2.length) return false;
    if (keys1.join() !== keys2.join()) return false;

    return keys1.every((key) => this.areObjectsEqual(obj1[key], obj2[key], depth + 1));
  }

  private areCommandsEqual(
    existingCommand: APIApplicationCommand,
    newCommand: RESTPostAPIApplicationCommandsJSONBody,
  ): boolean {
    const normalizeCommand = (cmd: any) => ({
      name: cmd.name,
      description: cmd.description ?? undefined,
      options: cmd.options ?? [],
      default_member_permissions: cmd.default_member_permissions ?? null,
      nsfw: cmd.nsfw ?? false,
    });

    const normalizedExisting = normalizeCommand(existingCommand);
    const normalizedNew = normalizeCommand(newCommand);

    return this.areObjectsEqual(normalizedExisting, normalizedNew);
  }

  private keysToSnakeCase(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map((v) => this.keysToSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.fromEntries(
        Object.entries(obj).map(([key, value]) => [
          key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`),
          this.keysToSnakeCase(value),
        ]),
      );
    }
    return obj;
  }

  private localizeCommandOptions(basePath: string, options: CommandOption[]): any[] {
    return options.map((option) => {
      const apiOption: Partial<typeof option> = { ...option };
      if ("onAutocomplete" in apiOption) {
        delete (apiOption as any).onAutocomplete;
      }

      const optionNameKey = `${basePath}.options.${apiOption.name}.name` as I18nKey;
      const optionDescriptionKey = `${basePath}.options.${apiOption.name}.description` as I18nKey;

      let localizedSubOptions: any[] | undefined;
      if (
        (apiOption.type === ApplicationCommandOptionType.Subcommand ||
          apiOption.type === ApplicationCommandOptionType.SubcommandGroup) &&
        apiOption.options
      ) {
        const newBasePath = `${basePath}.options.${apiOption.name}`;
        localizedSubOptions = this.localizeCommandOptions(
          newBasePath,
          apiOption.options as CommandOption[],
        );
      }

      return {
        ...this.keysToSnakeCase(apiOption),
        name: apiOption.name,
        name_localizations: getLocalizations(optionNameKey),
        description: (apiOption as any).description,
        description_localizations: getLocalizations(optionDescriptionKey),
        options: localizedSubOptions,
      };
    });
  }

  private transformCommandToJson(command: AnyCommand): RESTPostAPIApplicationCommandsJSONBody {
    const baseData = {
      nsfw: command.nsfw,
      contexts: command.contexts,
      integration_types: command.integrationTypes,
      default_member_permissions: command.defaultMemberPermissions
        ? String(PermissionsBitField.resolve(command.defaultMemberPermissions))
        : null,
    };

    if (command.type === ApplicationCommandType.ChatInput) {
      const nameKey = `commands.${command.name}.name` as I18nKey;
      const translatedName = nimbus.tLocale(Locale.EnglishUS, nameKey);
      const finalName =
        translatedName === nameKey || translatedName.startsWith("[Missing:")
          ? command.name
          : translatedName;

      const descriptionKey = `commands.${command.name}.description` as I18nKey;
      const translatedDescription = nimbus.tLocale(Locale.EnglishUS, descriptionKey);
      const finalDescription =
        translatedDescription === descriptionKey || translatedDescription.startsWith("[Missing:")
          ? command.description
          : translatedDescription;

      const localizedOptions = command.options
        ? this.localizeCommandOptions(`commands.${command.name}`, command.options)
        : undefined;

      return {
        ...baseData,
        name: finalName,
        name_localizations: getLocalizations(nameKey),
        description: finalDescription,
        description_localizations: getLocalizations(descriptionKey),
        options: localizedOptions,
        type: ApplicationCommandType.ChatInput,
      };
    } else {
      const commandKey = command.name.toLowerCase().replace(/ /g, "-");
      const nameKey = `commands.${commandKey}.name` as I18nKey;
      const translatedName = nimbus.tLocale(Locale.EnglishUS, nameKey);
      const finalName =
        translatedName === nameKey || translatedName.startsWith("[Missing:")
          ? command.name
          : translatedName;

      return {
        ...baseData,
        name: finalName,
        name_localizations: getLocalizations(nameKey),
        type: command.type,
      };
    }
  }

  public async registerApplicationCommands(
    client: Client,
    commands: Map<string, AnyCommand>,
    guilds?: readonly string[],
  ): Promise<void> {
    const clientId = client.user!.id;
    const globalCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
    const guildCommands = new Map<string, RESTPostAPIApplicationCommandsJSONBody[]>();
    const allGuildIds = new Set<string>(client.guilds.cache.map((g) => g.id));
    if (guilds) guilds.forEach((id) => allGuildIds.add(id));

    for (const command of commands.values()) {
      const apiData = this.transformCommandToJson(command);
      const targetGuilds = command.guilds ?? guilds;

      if (targetGuilds?.length) {
        targetGuilds.forEach((guildId) => allGuildIds.add(guildId));
        for (const guildId of new Set(targetGuilds)) {
          const list = guildCommands.get(guildId) ?? [];
          list.push(apiData);
          guildCommands.set(guildId, list);
        }
      } else {
        globalCommands.push(apiData);
      }
    }

    try {
      const existingGlobalCommands = (await this.rest.get(
        Routes.applicationCommands(clientId),
      )) as APIApplicationCommand[];
      if (!this.areObjectsEqual(existingGlobalCommands, globalCommands)) {
        logger.api(`Refreshing ${globalCommands.length} global (/) commands...`);
        await this.rest.put(Routes.applicationCommands(clientId), { body: globalCommands });
      }

      for (const guildId of allGuildIds) {
        const commandsToDeploy = guildCommands.get(guildId) ?? [];
        const existingGuildCommands = (await this.rest.get(
          Routes.applicationGuildCommands(clientId, guildId),
        )) as APIApplicationCommand[];

        const hasChanges =
          commandsToDeploy.length !== existingGuildCommands.length ||
          !commandsToDeploy.every((newCmd) =>
            existingGuildCommands.some((oldCmd) => this.areCommandsEqual(oldCmd, newCmd)),
          );

        if (hasChanges) {
          logger.api(`Syncing ${commandsToDeploy.length} commands for guild ${guildId}...`);
          await this.rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commandsToDeploy,
          });
        }
      }

      logger.command(`Loaded ${commands.size} (/) slash commands.`);
    } catch (error) {
      logger.error("Failed to register commands with Discord API:", error);
      throw error;
    }
  }
}
