import {
  ActionRowBuilder,
  ButtonBuilder,
  ContainerBuilder,
  FileBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  SectionBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type MessageActionRowComponentBuilder,
} from "discord.js";

/**
 * A union type for all components that can be placed inside a Container.
 */
type ContainerResolvableComponent =
  | TextDisplayBuilder
  | SectionBuilder
  | SeparatorBuilder
  | FileBuilder
  | MediaGalleryBuilder
  | ActionRowBuilder<MessageActionRowComponentBuilder>;

/**
 * A union type for a Section's accessory, which can be a Thumbnail or a Button.
 */
type SectionAccessory = ThumbnailBuilder | ButtonBuilder;

/**
 * Options for creating a Section component.
 */
type SectionOptions = {
  text: string[];
  accessory?: SectionAccessory;
};

/**
 * Options for creating a Container component.
 */
type ContainerOptions = {
  components: ContainerResolvableComponent[];
  accentColor?: number;
};

/**
 * A collection of pre-built separator components for convenience.
 */
export const LunaSeparators = {
  Small: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
  Large: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large),
  SmallLine: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
  LargeLine: new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Large).setDivider(true),
};

/**
 * Creates a Text Display component.
 */
export function createTextDisplay(options: { content: string }): TextDisplayBuilder {
  return new TextDisplayBuilder().setContent(options.content);
}

/**
 * Creates a File component.
 */
export function createFile(options: { url: string }): FileBuilder {
  return new FileBuilder().setURL(options.url);
}

/**
 * Creates a Thumbnail component.
 */
export function createThumbnail(options: { url: string; description?: string }): ThumbnailBuilder {
  const thumbnail = new ThumbnailBuilder().setURL(options.url);
  if (options.description) {
    thumbnail.setDescription(options.description);
  }
  return thumbnail;
}

/**
 * Creates a Section component.
 */
export function createSection(options: SectionOptions): SectionBuilder {
  const section = new SectionBuilder();

  const textDisplays = options.text.map((t) => new TextDisplayBuilder().setContent(t));
  section.addTextDisplayComponents(...textDisplays);

  if (options.accessory) {
    // Use a unique property ('setCustomId') to reliably identify a ButtonBuilder.
    if ("setCustomId" in options.accessory) {
      section.setButtonAccessory(options.accessory as ButtonBuilder);
    } else {
      section.setThumbnailAccessory(options.accessory as ThumbnailBuilder);
    }
  }

  return section;
}

/**
 * Options for creating a Media Gallery component.
 */
type MediaGalleryOptions = {
  items: {
    url: string;
    description?: string;
    spoiler?: boolean;
  }[];
};

/**
 * Creates a Media Gallery component.
 */
export function createMediaGallery(options: MediaGalleryOptions): MediaGalleryBuilder {
  const galleryItems = options.items.map((item) => {
    const galleryItem = new MediaGalleryItemBuilder().setURL(item.url);
    if (item.description) galleryItem.setDescription(item.description);
    if (item.spoiler) galleryItem.setSpoiler(item.spoiler);
    return galleryItem;
  });
  return new MediaGalleryBuilder().addItems(...galleryItems);
}

/**
 * Creates a Container component.
 */
export function createContainer(options: ContainerOptions): ContainerBuilder {
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
    }
  }

  return container;
}
