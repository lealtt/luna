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
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  type ModalActionRowComponentBuilder,
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

// Options for creating a button.
interface CreateButtonOptions {
  customId: string;
  label?: string;
  style?: ButtonStyle;
  emoji?: APIMessageComponentEmoji | string;
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

// Options for creating a select menu.
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

// Options for a text input within a modal.
interface CreateTextInputOptions {
  customId: string;
  label: string;
  style?: TextInputStyle;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  value?: string;
}

/**
 * A factory function for creating a text input builder (TextInputBuilder).
 * @param options The options for the text input.
 * @returns A TextInputBuilder instance.
 */
export function createTextInput(options: CreateTextInputOptions): TextInputBuilder {
  const textInput = new TextInputBuilder()
    .setCustomId(options.customId)
    .setLabel(options.label)
    .setStyle(options.style ?? TextInputStyle.Short)
    .setRequired(options.required ?? true);

  if (options.placeholder) textInput.setPlaceholder(options.placeholder);
  if (options.minLength) textInput.setMinLength(options.minLength);
  if (options.maxLength) textInput.setMaxLength(options.maxLength);
  if (options.value) textInput.setValue(options.value);

  return textInput;
}

// Options for creating a modal.
interface CreateModalOptions {
  customId: string;
  title: string;
  components: TextInputBuilder[];
}

/**
 * A factory function for creating a Modal builder (ModalBuilder).
 * @param options The options for the modal.
 * @returns A ModalBuilder instance.
 */
export function createModal(options: CreateModalOptions): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(options.customId).setTitle(options.title);

  const rows = options.components.map((component) =>
    new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(component),
  );

  modal.addComponents(rows);

  return modal;
}
