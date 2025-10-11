import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  MentionableSelectMenuBuilder,
  type APIMessageComponentEmoji,
  StringSelectMenuOptionBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  LabelBuilder,
  TextDisplayBuilder,
} from "discord.js";
import { createLabel } from "./component.v2.builder.js";

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
// This is now a discriminated union based on the button's style.
type CreateButtonOptions =
  | {
      style: ButtonStyle.Link;
      url: string; // 'url' is required for link buttons
      customId?: never; // 'customId' is not allowed
      label?: string;
      emoji?: APIMessageComponentEmoji | string;
      disabled?: boolean;
    }
  | {
      style?: Exclude<ButtonStyle, ButtonStyle.Link>;
      url?: never; // 'url' is not allowed for other styles
      customId: string; // 'customId' is required for other styles
      label?: string;
      emoji?: APIMessageComponentEmoji | string;
      disabled?: boolean;
    };

/**
 * A simple factory function for creating a ButtonBuilder.
 * It is now type-safe and handles Link buttons correctly.
 * @param options The options for the button.
 * @returns A ButtonBuilder instance.
 */
export function createButton(options: CreateButtonOptions): ButtonBuilder {
  const button = new ButtonBuilder();

  if (options.style === ButtonStyle.Link) {
    // Logic for Link buttons
    button.setStyle(ButtonStyle.Link).setURL(options.url);
  } else {
    // Logic for all other button styles
    button.setStyle(options.style ?? ButtonStyle.Primary).setCustomId(options.customId);
  }

  if (options.label) button.setLabel(options.label);
  if (options.emoji) button.setEmoji(options.emoji);
  if (options.disabled) button.setDisabled(options.disabled);

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

// A new, simpler type for defining select menu options.
type StringSelectMenuOptionData = {
  label: string;
  value: string;
  description?: string;
  emoji?: APIMessageComponentEmoji | string;
  default?: boolean;
};

// A union type allowing either a simple object or a full builder for options.
type StringSelectMenuOptionResolvable = StringSelectMenuOptionData | StringSelectMenuOptionBuilder;

/**
 * A simple factory function for creating a StringSelectMenuBuilder.
 */
export function createStringSelectMenu<T extends StringSelectMenuOptionResolvable>(
  options: CreateSelectMenuOptions & {
    options: T[];
  },
): StringSelectMenuBuilder {
  // Map the simple option objects or builders to StringSelectMenuOptionBuilder instances
  const menuOptions = options.options.map((opt) =>
    opt instanceof StringSelectMenuOptionBuilder
      ? opt
      : new StringSelectMenuOptionBuilder(opt as any),
  );

  return new StringSelectMenuBuilder()
    .setCustomId(options.customId)
    .setPlaceholder(options.placeholder ?? "Select an option")
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false)
    .setOptions(menuOptions);
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

// Options for a text input without a label.
interface CreateTextInputOptions {
  label?: never; // Explicitly forbid the label property here
  customId: string;
  style?: TextInputStyle;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  value?: string;
}

// Options for a text input that will be wrapped in a label.
interface CreateLabeledTextInputOptions extends Omit<CreateTextInputOptions, "label"> {
  label: string; // Make the label property required here
}

/**
 * Creates a Labeled Text Input when a 'label' is provided.
 */
export function createTextInput(options: CreateLabeledTextInputOptions): LabelBuilder;
/**
 * Creates a standard Text Input when no 'label' is provided.
 */
export function createTextInput(options: CreateTextInputOptions): TextInputBuilder;
/**
 * A factory function for creating a text input builder.
 * It intelligently returns a LabelBuilder if a 'label' is provided,
 * otherwise it returns a standard TextInputBuilder.
 * @param options The options for the text input.
 * @returns A LabelBuilder or a TextInputBuilder.
 */
export function createTextInput(
  options: CreateTextInputOptions | CreateLabeledTextInputOptions,
): LabelBuilder | TextInputBuilder {
  // Check if a label is provided in the options.
  if ("label" in options && options.label) {
    const { label, ...textInputOptions } = options;
    const textInput = new TextInputBuilder(textInputOptions);
    return createLabel({ label, component: textInput });
  }

  // If no label, create and return a standard TextInputBuilder.
  return new TextInputBuilder(options);
}

// New custom Type for Modal Components
type ModalComponent = LabelBuilder | TextDisplayBuilder;

// Options for creating a modal.
interface CreateModalOptions {
  customId: string;
  title: string;
  components: ModalComponent[];
}

/**
 * A factory function for creating a Modal builder (ModalBuilder).
 * Now supports TextInputs, LabelBuilders, and TextDisplayBuilders.
 * @param options The options for the modal.
 * @returns A ModalBuilder instance.
 */
export function createModal(options: CreateModalOptions): ModalBuilder {
  const modal = new ModalBuilder().setCustomId(options.customId).setTitle(options.title);

  const labelComponents: LabelBuilder[] = [];
  const textDisplayComponents: TextDisplayBuilder[] = [];

  for (const component of options.components) {
    if (component instanceof LabelBuilder) {
      labelComponents.push(component);
    } else if (component instanceof TextDisplayBuilder) {
      textDisplayComponents.push(component);
    }
  }

  if (textDisplayComponents.length) modal.addTextDisplayComponents(...textDisplayComponents);

  if (labelComponents.length) modal.addLabelComponents(...labelComponents);

  return modal;
}
