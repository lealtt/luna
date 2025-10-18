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
import { defaultLocale, logger, t, type I18nKey, type TranslationVariables } from "#utils";

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
 * A union of all component builders that can be used as an accessory in a Section.
 */
export type SectionAccessory = ThumbnailBuilder | ButtonBuilder;

/**
 * A union of all component builders that can be nested inside a Label.
 */
export type LabelableComponent =
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder
  | TextInputBuilder;

/**
 * Defines the common options for internationalization (i18n).
 */
interface I18nOptions {
  locale?: string;
  i18nKey?: I18nKey;
  variables?: TranslationVariables;
}

/**
 * Extends I18nOptions to include a fallback content string.
 */
interface I18nTextOptions extends I18nOptions {
  content?: string;
}

/**
 * Resolves text content with internationalization support.
 * It prioritizes the translated string from `i18nKey`. If translation fails or is not provided,
 * it falls back to the `content` property, and then to an optional final fallback string.
 */
function resolveText(options: I18nTextOptions, fallback?: string): string | undefined {
  const { locale = defaultLocale, i18nKey, variables, content } = options;

  if (i18nKey) {
    const translated = t(locale, i18nKey, variables);

    if (translated && translated !== i18nKey) {
      return translated;
    }
  }

  return content ?? fallback;
}

/**
 * Resolves text content and throws an error if the text cannot be resolved.
 * This is a wrapper around `resolveText` for cases where text is mandatory.
 */
function requireText(options: I18nTextOptions, errorContext: string): string {
  const text = resolveText(options);

  if (!text) {
    logger.error(`${errorContext}: Could not resolve text from i18nKey or content.`);
    throw new Error(`${errorContext} requires valid text content.`);
  }

  return text;
}

/**
 * A collection of pre-configured SeparatorBuilder instances for common use cases.
 */
export const LunaSeparators = {
  Small: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  Large: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
  SmallLine: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  LargeLine: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
} as const;

/**
 * A factory function for creating a TextDisplayBuilder.
 * Accepts a string for shorthand usage or an options object for i18n support.
 */
export function createTextDisplay(options: string | I18nTextOptions): TextDisplayBuilder {
  if (typeof options === "string") {
    return new TextDisplayBuilder().setContent(options);
  }

  const content = requireText(options, "createTextDisplay");
  return new TextDisplayBuilder().setContent(content);
}

/**
 * A factory function for creating a FileBuilder.
 */
export function createFile(url: string): FileBuilder {
  if (!url) {
    throw new Error("File requires a valid URL.");
  }
  return new FileBuilder().setURL(url);
}

/**
 * Defines the options for creating a Thumbnail.
 */
export interface ThumbnailOptions extends I18nTextOptions {
  url: string;
}

/**
 * A factory function for creating a ThumbnailBuilder.
 * Accepts a URL string for shorthand usage or an options object for a description with i18n.
 */
export function createThumbnail(options: string | ThumbnailOptions): ThumbnailBuilder {
  if (typeof options === "string") {
    return new ThumbnailBuilder().setURL(options);
  }

  if (!options.url) {
    throw new Error("Thumbnail requires a valid URL.");
  }

  const builder = new ThumbnailBuilder().setURL(options.url);
  const description = resolveText(options);

  if (description) {
    builder.setDescription(description);
  }

  return builder;
}

/**
 * Defines the options for creating a Section.
 */
export interface SectionOptions {
  locale?: string;
  text: string | string[] | I18nTextOptions[];
  accessory?: SectionAccessory;
}

/**
 * A factory function for creating a SectionBuilder.
 * A section is a flexible component that holds text and an optional accessory.
 */
export function createSection(options: SectionOptions): SectionBuilder {
  const { locale = defaultLocale, text, accessory } = options;

  if (!text || (Array.isArray(text) && text.length === 0)) {
    throw new Error("Section requires at least one text item.");
  }

  const section = new SectionBuilder();
  const textItems = Array.isArray(text) ? text : [text];

  const textDisplays = textItems.map((item) => {
    if (typeof item === "string") {
      return createTextDisplay(item);
    }
    return createTextDisplay({ locale, ...item });
  });

  section.addTextDisplayComponents(...textDisplays);

  if (accessory) {
    if (accessory instanceof ButtonBuilder) {
      section.setButtonAccessory(accessory);
    } else if (accessory instanceof ThumbnailBuilder) {
      section.setThumbnailAccessory(accessory);
    }
  }

  return section;
}

/**
 * Defines the options for a single item within a MediaGallery.
 */
export interface MediaGalleryItemOptions extends I18nTextOptions {
  url: string;
  spoiler?: boolean;
}

/**
 * Defines the options for creating a MediaGallery.
 */
export interface MediaGalleryOptions {
  locale?: string;
  items: (string | MediaGalleryItemOptions)[];
}

/**
 * A factory function for creating a MediaGalleryBuilder.
 * A media gallery displays a collection of images.
 */
export function createMediaGallery(options: MediaGalleryOptions): MediaGalleryBuilder {
  const { locale = defaultLocale, items } = options;

  if (!items || items.length === 0) {
    throw new Error("MediaGallery requires at least one item.");
  }

  const galleryItems = items.map((item) => {
    if (typeof item === "string") {
      return new MediaGalleryItemBuilder().setURL(item);
    }

    if (!item.url) {
      throw new Error("MediaGallery item requires a valid URL.");
    }

    const galleryItem = new MediaGalleryItemBuilder().setURL(item.url);
    const description = resolveText({ locale, ...item });

    if (description) {
      galleryItem.setDescription(description);
    }

    if (item.spoiler) {
      galleryItem.setSpoiler(item.spoiler);
    }

    return galleryItem;
  });

  return new MediaGalleryBuilder().addItems(...galleryItems);
}

/**
 * Defines the options for creating a Container.
 */
export interface ContainerOptions {
  components: ContainerResolvableComponent[];
  accentColor?: number;
}

/**
 * A helper structure for routing components to their correct "add" method in a ContainerBuilder.
 */
const componentRouters = [
  {
    check: (c: any): c is SectionBuilder => c instanceof SectionBuilder,
    add: (container: ContainerBuilder, c: SectionBuilder) => container.addSectionComponents(c),
  },
  {
    check: (c: any): c is TextDisplayBuilder => c instanceof TextDisplayBuilder,
    add: (container: ContainerBuilder, c: TextDisplayBuilder) =>
      container.addTextDisplayComponents(c),
  },
  {
    check: (c: any): c is SeparatorBuilder => c instanceof SeparatorBuilder,
    add: (container: ContainerBuilder, c: SeparatorBuilder) => container.addSeparatorComponents(c),
  },
  {
    check: (c: any): c is FileBuilder => c instanceof FileBuilder,
    add: (container: ContainerBuilder, c: FileBuilder) => container.addFileComponents(c),
  },
  {
    check: (c: any): c is MediaGalleryBuilder => c instanceof MediaGalleryBuilder,
    add: (container: ContainerBuilder, c: MediaGalleryBuilder) =>
      container.addMediaGalleryComponents(c),
  },
  {
    check: (c: any): c is ActionRowBuilder<MessageActionRowComponentBuilder> =>
      c instanceof ActionRowBuilder,
    add: (container: ContainerBuilder, c: ActionRowBuilder<MessageActionRowComponentBuilder>) =>
      container.addActionRowComponents(c),
  },
] as const;

/**
 * A factory function for creating a ContainerBuilder.
 * The container is the top-level component that holds all other V2 components.
 */
export function createContainer(options: ContainerOptions): ContainerBuilder {
  const { components, accentColor } = options;

  if (!components || components.length === 0) {
    throw new Error("Container requires at least one component.");
  }

  const container = new ContainerBuilder();

  if (accentColor) {
    container.setAccentColor(accentColor);
  }

  for (const component of components) {
    const router = componentRouters.find((r) => r.check(component));

    if (router) {
      router.add(container, component as any);
    } else {
      throw new Error("Unsupported component type in container.");
    }
  }

  return container;
}

/**
 * Defines the options for creating a Label.
 */
export interface CreateLabelOptions extends I18nTextOptions {
  component: LabelableComponent;
  description?: string;
  descriptionI18nKey?: I18nKey;
  descriptionVariables?: TranslationVariables;
}

/**
 * A helper structure for routing components to their correct "set" method in a LabelBuilder.
 */
const labelComponentSetters = [
  {
    check: (c: any): c is StringSelectMenuBuilder => c instanceof StringSelectMenuBuilder,
    set: (label: LabelBuilder, c: StringSelectMenuBuilder) => label.setStringSelectMenuComponent(c),
  },
  {
    check: (c: any): c is UserSelectMenuBuilder => c instanceof UserSelectMenuBuilder,
    set: (label: LabelBuilder, c: UserSelectMenuBuilder) => label.setUserSelectMenuComponent(c),
  },
  {
    check: (c: any): c is RoleSelectMenuBuilder => c instanceof RoleSelectMenuBuilder,
    set: (label: LabelBuilder, c: RoleSelectMenuBuilder) => label.setRoleSelectMenuComponent(c),
  },
  {
    check: (c: any): c is ChannelSelectMenuBuilder => c instanceof ChannelSelectMenuBuilder,
    set: (label: LabelBuilder, c: ChannelSelectMenuBuilder) =>
      label.setChannelSelectMenuComponent(c),
  },
  {
    check: (c: any): c is MentionableSelectMenuBuilder => c instanceof MentionableSelectMenuBuilder,
    set: (label: LabelBuilder, c: MentionableSelectMenuBuilder) =>
      label.setMentionableSelectMenuComponent(c),
  },
  {
    check: (c: any): c is TextInputBuilder => c instanceof TextInputBuilder,
    set: (label: LabelBuilder, c: TextInputBuilder) => label.setTextInputComponent(c),
  },
] as const;

/**
 * A factory function for creating a LabelBuilder.
 * A label wraps another component (like a select menu or text input) to provide a title and description.
 * This is primarily used in modals.
 */
export function createLabel(options: CreateLabelOptions): LabelBuilder {
  const {
    locale = defaultLocale,
    component,
    description,
    descriptionI18nKey,
    descriptionVariables,
  } = options;

  if (!component) {
    throw new Error("Label requires a component.");
  }

  const labelText = requireText(options, "createLabel");
  const labelBuilder = new LabelBuilder().setLabel(labelText);

  const resolvedDescription = resolveText({
    locale,
    content: description,
    i18nKey: descriptionI18nKey,
    variables: descriptionVariables,
  });

  if (resolvedDescription) {
    labelBuilder.setDescription(resolvedDescription);
  }

  const setter = labelComponentSetters.find((s) => s.check(component));

  if (setter) {
    setter.set(labelBuilder, component as any);
  } else {
    throw new Error("Unsupported component type for label.");
  }

  return labelBuilder;
}
