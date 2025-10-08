import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  type APIEmbed,
  type APIMessageComponentEmoji,
  type ColorResolvable,
  type StringSelectMenuOptionBuilder,
} from "discord.js";

// A more flexible type for embed options, allowing for a ColorResolvable color.
type CreateEmbedOptions = Omit<APIEmbed, "color"> & {
  color?: ColorResolvable;
};

/**
 * A simple factory function for creating an EmbedBuilder.
 * @param options The options for the embed, with a flexible color type.
 * @returns An EmbedBuilder instance.
 */
export function createEmbed(options: CreateEmbedOptions): EmbedBuilder {
  const { color, ...rest } = options;
  const embed = new EmbedBuilder(rest);

  if (color) {
    embed.setColor(color);
  }

  return embed;
}

// Defines the types of component builders that can be added to an action row.
type MessageActionRowComponentBuilders =
  | ButtonBuilder
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder;

/**
 * A simple factory function for creating an ActionRowBuilder.
 * @param components The components to add to the row.
 * @returns An ActionRowBuilder instance.
 */
export function createRow(
  ...components: MessageActionRowComponentBuilders[]
): ActionRowBuilder<MessageActionRowComponentBuilders> {
  return new ActionRowBuilder<MessageActionRowComponentBuilders>().addComponents(components);
}

interface CreateButtonOptions {
  customId: string;
  label?: string;
  style?: ButtonStyle;
  emoji?: APIMessageComponentEmoji;
  disabled?: boolean;
}

/**
 * A simple factory function for creating a ButtonBuilder.
 * @param options The options for the button.
 * @returns A ButtonBuilder instance.
 */
export function createButton(options: CreateButtonOptions): ButtonBuilder {
  const button = new ButtonBuilder()
    .setCustomId(options.customId)
    .setStyle(options.style ?? ButtonStyle.Primary)
    .setDisabled(options.disabled ?? false);

  if (options.label) button.setLabel(options.label);
  if (options.emoji) button.setEmoji(options.emoji);

  return button;
}

interface CreateSelectMenuOptions {
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
}

/**
 * A simple factory function for creating a StringSelectMenuBuilder.
 */
export function createStringSelectMenu(
  options: CreateSelectMenuOptions & {
    options: StringSelectMenuOptionBuilder[];
  },
): StringSelectMenuBuilder {
  return new StringSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder ?? "Select an option")
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false)
    .setOptions(options.options);
}

/**
 * A simple factory function for creating a UserSelectMenuBuilder.
 */
export function createUserSelectMenu(options: CreateSelectMenuOptions): UserSelectMenuBuilder {
  return new UserSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder ?? "Select a user")
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false);
}

/**
 * A simple factory function for creating a RoleSelectMenuBuilder.
 */
export function createRoleSelectMenu(options: CreateSelectMenuOptions): RoleSelectMenuBuilder {
  return new RoleSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder ?? "Select a role")
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false);
}

/**
 * A simple factory function for creating a ChannelSelectMenuBuilder.
 */
export function createChannelSelectMenu(
  options: CreateSelectMenuOptions,
): ChannelSelectMenuBuilder {
  return new ChannelSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder ?? "Select a channel")
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false);
}

/**
 * A simple factory function for creating a MentionableSelectMenuBuilder.
 */
export function createMentionableSelectMenu(
  options: CreateSelectMenuOptions,
): MentionableSelectMenuBuilder {
  return new MentionableSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder ?? "Select a user or role")
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false);
}
