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
import { createLabel, type CreateLabelOptions } from "./component.v2.builder.js";
import { logger, t, type I18nKey } from "#utils";

/**
 * A union of all component builders that can be placed inside an ActionRow in a message.
 */
export type MessageActionRowComponentBuilders =
  | ButtonBuilder
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder;

/* Defines the button content: either it has an emoji (and the label is optional)
 * or it doesn't have an emoji (and the label is mandatory).
 */
type ButtonContent =
  | { emoji: APIMessageComponentEmoji | string; label?: string; labelI18nKey?: I18nKey }
  | {
      emoji?: never;
      label: string;
      labelI18nKey?: I18nKey;
    }
  | {
      emoji?: never;
      label?: string;
      labelI18nKey: I18nKey;
    };

/**
 * Defines the options for creating a button, handling link buttons and standard buttons
 * as a discriminated union. Supports i18n for labels.
 */
export type CreateButtonOptions = {
  locale?: string;
  disabled?: boolean;
} & (
  | { style: ButtonStyle.Link; url: string; customId?: never }
  | { style?: Exclude<ButtonStyle, ButtonStyle.Link>; url?: never; customId: string }
) &
  ButtonContent;

/**
 * Defines the base options for all select menu types. Supports i18n for placeholders.
 */
export type CreateSelectMenuOptions = {
  locale?: string;
  customId: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
  required?: boolean;
} & (
  | { placeholder: string; placeholderI18nKey?: I18nKey }
  | { placeholder?: string; placeholderI18nKey: I18nKey }
);

/**
 * Defines the data structure for a single option within a StringSelectMenu.
 * Supports i18n for both label and description.
 */
export type StringSelectMenuOptionData = {
  value: string;
  emoji?: APIMessageComponentEmoji | string;
  default?: boolean;
} & ({ label: string; labelI18nKey?: I18nKey } | { label?: string; labelI18nKey: I18nKey }) &
  (
    | { description?: string; descriptionI18nKey?: I18nKey }
    | { description: string; descriptionI18nKey?: I18nKey }
  );

/**
 * A type that can be resolved to a StringSelectMenuOptionBuilder, allowing either
 * a raw data object or a pre-made builder instance.
 */
export type StringSelectMenuOptionResolvable =
  | StringSelectMenuOptionData
  | StringSelectMenuOptionBuilder;

/**
 * Defines the base options for creating a text input component.
 * Supports i18n for placeholders.
 */
export interface CreateTextInputOptions {
  locale?: string;
  customId: string;
  style?: TextInputStyle;
  placeholder?: string;
  placeholderI18nKey?: I18nKey;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  value?: string;
}

/**
 * Extends the base text input options to require a label, for use in modals.
 * Supports i18n for labels.
 */
export type CreateLabeledTextInputOptions = CreateTextInputOptions &
  ({ label: string; labelI18nKey?: I18nKey } | { label?: string; labelI18nKey: I18nKey });

/**
 * A union of all component types that are valid inside a `createModal` call.
 */
export type ModalComponent = LabelBuilder | TextDisplayBuilder;

/**
 * Defines the options for creating a modal. Supports i18n for the title.
 */
export type CreateModalOptions = {
  locale?: string;
  customId: string;
  components: ModalComponent[];
} & ({ title: string; titleI18nKey?: I18nKey } | { title?: string; titleI18nKey: I18nKey });

/**
 * A factory function for creating an ActionRowBuilder for message components.
 * @param components The components to add to the row.
 * @returns An ActionRowBuilder instance.
 */
export function createRow<T extends MessageActionRowComponentBuilders>(
  ...components: T[]
): ActionRowBuilder<T> {
  if (components.length === 0) {
    logger.error("createRow: At least one component is required.");
    throw new Error("ActionRow requires at least one component.");
  }
  return new ActionRowBuilder<T>().addComponents(components);
}

/**
 * A factory function for creating a ButtonBuilder.
 * @param options The options for the button.
 * @returns A ButtonBuilder instance.
 */
export function createButton(options: CreateButtonOptions): ButtonBuilder {
  const { locale = "en-US" } = options;

  if (!options.label && !options.labelI18nKey && !options.emoji) {
    logger.error("createButton: A button must have at least a label or an emoji.");
    throw new Error("Button requires a label or an emoji.");
  }

  if (options.style === ButtonStyle.Link && !options.url) {
    logger.error("createButton: URL is required for Link buttons.");
    throw new Error("Link button requires a valid URL.");
  }
  if (options.style !== ButtonStyle.Link && !options.customId) {
    logger.error("createButton: Custom ID is required for non-Link buttons.");
    throw new Error("Non-Link button requires a custom ID.");
  }

  const button = new ButtonBuilder();
  if (options.style === ButtonStyle.Link) {
    button.setStyle(ButtonStyle.Link).setURL(options.url);
  } else {
    button.setStyle(options.style ?? ButtonStyle.Primary).setCustomId(options.customId);
  }

  const translatedLabel = options.labelI18nKey ? t(locale, options.labelI18nKey) : undefined;
  const label =
    translatedLabel && translatedLabel !== options.labelI18nKey ? translatedLabel : options.label;
  if (label) {
    button.setLabel(label);
  }

  if (options.emoji) button.setEmoji(options.emoji);
  if (options.disabled) button.setDisabled(options.disabled);

  return button;
}

/**
 * A factory function for creating a StringSelectMenuBuilder.
 * @param options The options for the string select menu.
 * @returns A StringSelectMenuBuilder instance.
 */
export function createStringSelectMenu(
  options: CreateSelectMenuOptions & { options: StringSelectMenuOptionResolvable[] },
): StringSelectMenuBuilder {
  const { locale = "en-US" } = options;

  if (!options.customId) {
    logger.error("createStringSelectMenu: Custom ID is required.");
    throw new Error("StringSelectMenu requires a custom ID.");
  }
  if (!options.options || options.options.length === 0) {
    logger.error("createStringSelectMenu: At least one option is required.");
    throw new Error("StringSelectMenu requires at least one option.");
  }

  const menuOptions = options.options.map((opt) => {
    if (opt instanceof StringSelectMenuOptionBuilder) return opt;

    const translatedLabel = opt.labelI18nKey ? t(locale, opt.labelI18nKey) : undefined;
    const label =
      translatedLabel && translatedLabel !== opt.labelI18nKey ? translatedLabel : opt.label;
    if (!label) {
      logger.error(`createStringSelectMenu: Label for value "${opt.value}" could not be resolved.`);
      throw new Error("Select menu option requires a valid label.");
    }

    const menuOption = new StringSelectMenuOptionBuilder().setLabel(label).setValue(opt.value);

    const translatedDesc = opt.descriptionI18nKey ? t(locale, opt.descriptionI18nKey) : undefined;
    const description =
      translatedDesc && translatedDesc !== opt.descriptionI18nKey
        ? translatedDesc
        : opt.description;
    if (description) menuOption.setDescription(description);

    if (opt.emoji) menuOption.setEmoji(opt.emoji);
    if (opt.default) menuOption.setDefault(opt.default);
    return menuOption;
  });

  const builder = new StringSelectMenuBuilder()
    .setCustomId(options.customId)
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false)
    .setRequired(options.required ?? false)
    .setOptions(menuOptions);

  const translatedPlaceholder = options.placeholderI18nKey
    ? t(locale, options.placeholderI18nKey)
    : undefined;
  const placeholder =
    translatedPlaceholder && translatedPlaceholder !== options.placeholderI18nKey
      ? translatedPlaceholder
      : options.placeholder;
  if (placeholder) builder.setPlaceholder(placeholder);

  return builder;
}

type GenericSelectMenuBuilder =
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder;

/**
 * Generic factory function to create and configure specific select menu builders.
 * @param Builder The constructor of the builder to use (e.g., UserSelectMenuBuilder).
 * @param options The configuration options for the menu.
 * @returns A configured instance of the builder.
 */
function createGenericSelectMenu<T extends GenericSelectMenuBuilder>(
  Builder: new () => T,
  options: CreateSelectMenuOptions,
): T {
  const { locale = "en-US" } = options;
  if (!options.customId) {
    logger.error("createGenericSelectMenu: Custom ID is required.");
    throw new Error("SelectMenu requires a custom ID.");
  }

  const builder = new Builder()
    .setCustomId(options.customId)
    .setMinValues(options.minValues ?? 1)
    .setMaxValues(options.maxValues ?? 1)
    .setDisabled(options.disabled ?? false)
    .setRequired(options.required ?? false);

  const translatedPlaceholder = options.placeholderI18nKey
    ? t(locale, options.placeholderI18nKey)
    : undefined;
  const placeholder =
    translatedPlaceholder && translatedPlaceholder !== options.placeholderI18nKey
      ? translatedPlaceholder
      : options.placeholder;

  if (placeholder) {
    builder.setPlaceholder(placeholder);
  }

  return builder as T;
}

/**
 * A factory function for creating a UserSelectMenuBuilder.
 * @param options The options for the user select menu.
 * @returns A UserSelectMenuBuilder instance.
 */
export function createUserSelectMenu(options: CreateSelectMenuOptions): UserSelectMenuBuilder {
  return createGenericSelectMenu(UserSelectMenuBuilder, options);
}

/**
 * A factory function for creating a RoleSelectMenuBuilder.
 * @param options The options for the role select menu.
 * @returns A RoleSelectMenuBuilder instance.
 */
export function createRoleSelectMenu(options: CreateSelectMenuOptions): RoleSelectMenuBuilder {
  return createGenericSelectMenu(RoleSelectMenuBuilder, options);
}

/**
 * A factory function for creating a ChannelSelectMenuBuilder.
 * @param options The options for the channel select menu.
 * @returns A ChannelSelectMenuBuilder instance.
 */
export function createChannelSelectMenu(
  options: CreateSelectMenuOptions,
): ChannelSelectMenuBuilder {
  return createGenericSelectMenu(ChannelSelectMenuBuilder, options);
}

/**
 * A factory function for creating a MentionableSelectMenuBuilder.
 * @param options The options for the mentionable select menu.
 * @returns A MentionableSelectMenuBuilder instance.
 */
export function createMentionableSelectMenu(
  options: CreateSelectMenuOptions,
): MentionableSelectMenuBuilder {
  return createGenericSelectMenu(MentionableSelectMenuBuilder, options);
}

/**
 * A factory function for creating a text input wrapped in a LabelBuilder, for use in modals.
 * @param options The options for the text input, including the label.
 * @returns A LabelBuilder instance containing the configured text input.
 */
export function createTextInput(options: CreateLabeledTextInputOptions): LabelBuilder {
  const { locale = "en-US", label, labelI18nKey, ...rest } = options;

  const textInputData = {
    ...rest,
    style: options.style ?? TextInputStyle.Short,
  };

  const textInput = new TextInputBuilder(textInputData);

  const translatedPlaceholder = options.placeholderI18nKey
    ? t(locale, options.placeholderI18nKey)
    : undefined;
  const placeholder =
    translatedPlaceholder && translatedPlaceholder !== options.placeholderI18nKey
      ? translatedPlaceholder
      : options.placeholder;
  if (placeholder) textInput.setPlaceholder(placeholder);

  return createLabel({
    locale,
    label,
    i18nKey: labelI18nKey,
    component: textInput,
  } as CreateLabelOptions);
}

/**
 * A factory function for creating a ModalBuilder.
 * @param options The options for the modal.
 * @returns A ModalBuilder instance.
 */
export function createModal(options: CreateModalOptions): ModalBuilder {
  const { locale = "en-US" } = options;

  if (!options.customId) {
    logger.error("createModal: Custom ID is required.");
    throw new Error("Modal requires a custom ID.");
  }
  if (!options.components || options.components.length === 0) {
    logger.error("createModal: At least one component is required.");
    throw new Error("Modal requires at least one component.");
  }

  const translatedTitle = options.titleI18nKey ? t(locale, options.titleI18nKey) : undefined;
  const title =
    translatedTitle && translatedTitle !== options.titleI18nKey ? translatedTitle : options.title;

  if (!title) {
    logger.error(`createModal: Title for "${options.customId}" could not be resolved.`);
    throw new Error("Modal title cannot be empty.");
  }

  const modal = new ModalBuilder().setCustomId(options.customId).setTitle(title);

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
