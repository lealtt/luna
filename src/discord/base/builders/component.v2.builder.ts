import {
  ActionRowBuilder,
  ButtonBuilder,
  ChannelSelectMenuBuilder,
  ContainerBuilder,
  FileBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MentionableSelectMenuBuilder,
  RoleSelectMenuBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  ThumbnailBuilder,
  UserSelectMenuBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";
import { logger, t, type I18nKey } from "#utils";

/**
 * A union of all component builders that can be placed inside a Container.
 */
export type ContainerResolvableComponent =
  | TextDisplayBuilder
  | SectionBuilder
  | SeparatorBuilder
  | FileBuilder
  | MediaGalleryBuilder
  | ActionRowBuilder<MessageActionRowComponentBuilder>;

/**
 * A union type for a Section's accessory, which can be a Thumbnail or a Button.
 */
export type SectionAccessory = ThumbnailBuilder | ButtonBuilder;

/**
 * A union of all component builders that can be wrapped by a LabelBuilder.
 */
export type LabelableComponent =
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder
  | TextInputBuilder;

/**
 * Defines the options for creating a TextDisplay, allowing either raw content
 * or an i18n key for translation.
 */
type TextOptions = { locale?: string } & (
  | { content: string; i18nKey?: I18nKey }
  | { content?: string; i18nKey: I18nKey }
);

/**
 * Defines the options for creating a Section component.
 */
export type SectionOptions = {
  locale?: string;
  text: string | string[] | TextOptions[];
  accessory?: SectionAccessory;
};

/**
 * Defines the options for creating a Container component.
 */
export interface ContainerOptions {
  components: ContainerResolvableComponent[];
  accentColor?: number;
}

/**
 * Defines the options for creating a MediaGallery component.
 */
export interface MediaGalleryOptions {
  locale?: string;
  items: { url: string; description?: string; i18nKey?: I18nKey; spoiler?: boolean }[];
}

/**
 * Defines the options for creating a LabelBuilder.
 */
export type CreateLabelOptions = {
  locale?: string;
  component: LabelableComponent;
  description?: string;
  descriptionI18nKey?: I18nKey;
} & ({ label: string; i18nKey?: I18nKey } | { label?: string; i18nKey: I18nKey });

/**
 * A collection of pre-built SeparatorBuilder instances for convenience.
 */
export const LunaSeparators = {
  Small: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  Large: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
  SmallLine: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  LargeLine: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
} as const;

/**
 * A factory function for creating a TextDisplayBuilder.
 * @param options The options for the text display.
 * @returns A TextDisplayBuilder instance.
 */
export function createTextDisplay(options: TextOptions): TextDisplayBuilder {
  const { locale = "en-US" } = options;
  const translated = options.i18nKey ? t(locale, options.i18nKey) : undefined;
  const content = translated && translated !== options.i18nKey ? translated : options.content;

  if (!content) {
    logger.error(`createTextDisplay: Failed to resolve content from i18nKey or fallback.`);
    throw new Error("TextDisplay content cannot be empty.");
  }
  return new TextDisplayBuilder().setContent(content);
}

/**
 * A factory function for creating a FileBuilder.
 * @param options The options for the file component.
 * @returns A FileBuilder instance.
 */
export function createFile(options: { url: string }): FileBuilder {
  if (!options.url) {
    logger.error("createFile: URL is required.");
    throw new Error("File requires a valid URL.");
  }
  return new FileBuilder().setURL(options.url);
}

/**
 * A factory function for creating a ThumbnailBuilder.
 * @param options The options for the thumbnail.
 * @returns A ThumbnailBuilder instance.
 */
export function createThumbnail(options: {
  locale?: string;
  url: string;
  description?: string;
  descriptionI18nKey?: I18nKey;
}): ThumbnailBuilder {
  const { locale = "en-US" } = options;
  if (!options.url) {
    logger.error("createThumbnail: URL is required.");
    throw new Error("Thumbnail requires a valid URL.");
  }
  const builder = new ThumbnailBuilder().setURL(options.url);
  if (options.description || options.descriptionI18nKey) {
    const translated = options.descriptionI18nKey
      ? t(locale, options.descriptionI18nKey)
      : undefined;
    const description =
      translated && translated !== options.descriptionI18nKey ? translated : options.description;

    if (description) {
      builder.setDescription(description);
    } else {
      logger.warn(`createThumbnail: Description for "${options.url}" could not be resolved.`);
    }
  }
  return builder;
}

/**
 * A factory function for creating a SectionBuilder.
 * @param options The options for the section.
 * @returns A SectionBuilder instance.
 */
export function createSection(options: SectionOptions): SectionBuilder {
  const { locale = "en-US" } = options;

  if (!options.text || (Array.isArray(options.text) && options.text.length === 0)) {
    logger.error("createSection: At least one text item is required.");
    throw new Error("Section requires at least one text item.");
  }

  const section = new SectionBuilder();
  const textItems = Array.isArray(options.text) ? options.text : [options.text];
  const textDisplays = textItems.map((item) => {
    if (typeof item === "string") {
      return createTextDisplay({ locale, content: item });
    }
    return createTextDisplay({ locale, ...item });
  });
  section.addTextDisplayComponents(...textDisplays);

  if (options.accessory) {
    if (options.accessory instanceof ButtonBuilder) {
      section.setButtonAccessory(options.accessory);
    } else if (options.accessory instanceof ThumbnailBuilder) {
      section.setThumbnailAccessory(options.accessory);
    } else {
      logger.error("createSection: Invalid accessory type.");
      throw new Error("Section accessory must be a ButtonBuilder or ThumbnailBuilder.");
    }
  }
  return section;
}

/**
 * A factory function for creating a MediaGalleryBuilder.
 * @param options The options for the media gallery.
 * @returns A MediaGalleryBuilder instance.
 */
export function createMediaGallery(options: MediaGalleryOptions): MediaGalleryBuilder {
  const { locale = "en-US" } = options;
  if (!options.items || options.items.length === 0) {
    logger.error("createMediaGallery: At least one item is required.");
    throw new Error("MediaGallery requires at least one item.");
  }

  const galleryItems = options.items.map((item) => {
    if (!item.url) {
      throw new Error("MediaGallery item requires a valid URL.");
    }
    const galleryItem = new MediaGalleryItemBuilder().setURL(item.url);
    const translated = item.i18nKey ? t(locale, item.i18nKey) : undefined;
    const description = translated && translated !== item.i18nKey ? translated : item.description;
    if (description) {
      galleryItem.setDescription(description);
    }
    if (item.spoiler) galleryItem.setSpoiler(item.spoiler);
    return galleryItem;
  });

  return new MediaGalleryBuilder().addItems(...galleryItems);
}

/**
 * A factory function for creating a ContainerBuilder, which holds various v2 components.
 * @param options The options for the container.
 * @returns A ContainerBuilder instance.
 */
export function createContainer(options: ContainerOptions): ContainerBuilder {
  if (!options.components || options.components.length === 0) {
    logger.error("createContainer: At least one component is required.");
    throw new Error("Container requires at least one component.");
  }

  const container = new ContainerBuilder();
  if (options.accentColor) {
    container.setAccentColor(options.accentColor);
  }

  for (const component of options.components) {
    if (component instanceof SectionBuilder) {
      container.addSectionComponents(component);
    } else if (component instanceof TextDisplayBuilder) {
      container.addTextDisplayComponents(component);
    } else if (component instanceof SeparatorBuilder) {
      container.addSeparatorComponents(component);
    } else if (component instanceof FileBuilder) {
      container.addFileComponents(component);
    } else if (component instanceof MediaGalleryBuilder) {
      container.addMediaGalleryComponents(component);
    } else if (component instanceof ActionRowBuilder) {
      container.addActionRowComponents(component);
    } else {
      logger.error("createContainer: Invalid component type provided.");
      throw new Error("Unsupported component type in container.");
    }
  }
  return container;
}

/**
 * A factory function for creating a LabelBuilder, which associates a label and description
 * with a single interactive component.
 * @param options The options for the label.
 * @returns A LabelBuilder instance.
 */
export function createLabel(options: CreateLabelOptions): LabelBuilder {
  const { locale = "en-US" } = options;

  if (!options.component) {
    throw new Error("Label requires a component.");
  }

  const translatedLabel = options.i18nKey ? t(locale, options.i18nKey) : undefined;
  const labelText =
    translatedLabel && translatedLabel !== options.i18nKey ? translatedLabel : options.label;

  if (!labelText) {
    throw new Error("Label text could not be resolved and cannot be empty.");
  }
  const labelBuilder = new LabelBuilder().setLabel(labelText);

  const translatedDesc = options.descriptionI18nKey
    ? t(locale, options.descriptionI18nKey)
    : undefined;
  const description =
    translatedDesc && translatedDesc !== options.descriptionI18nKey
      ? translatedDesc
      : options.description;
  if (description) {
    labelBuilder.setDescription(description);
  }

  if (options.component instanceof StringSelectMenuBuilder) {
    labelBuilder.setStringSelectMenuComponent(options.component);
  } else if (options.component instanceof UserSelectMenuBuilder) {
    labelBuilder.setUserSelectMenuComponent(options.component);
  } else if (options.component instanceof RoleSelectMenuBuilder) {
    labelBuilder.setRoleSelectMenuComponent(options.component);
  } else if (options.component instanceof ChannelSelectMenuBuilder) {
    labelBuilder.setChannelSelectMenuComponent(options.component);
  } else if (options.component instanceof MentionableSelectMenuBuilder) {
    labelBuilder.setMentionableSelectMenuComponent(options.component);
  } else if (options.component instanceof TextInputBuilder) {
    labelBuilder.setTextInputComponent(options.component);
  } else {
    logger.error("createLabel: Invalid component type for label.");
    throw new Error("Unsupported component type for label.");
  }

  return labelBuilder;
}
