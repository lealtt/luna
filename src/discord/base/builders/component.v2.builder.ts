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

// Map that associates a component's constructor with the correct method on ContainerBuilder.
const containerComponentHandlerMap = new Map<any, keyof ContainerBuilder>([
  [SectionBuilder, "addSectionComponents"],
  [TextDisplayBuilder, "addTextDisplayComponents"],
  [SeparatorBuilder, "addSeparatorComponents"],
  [FileBuilder, "addFileComponents"],
  [MediaGalleryBuilder, "addMediaGalleryComponents"],
  [ActionRowBuilder, "addActionRowComponents"],
]);

/**
 * Creates a Container component.
 */
export function createContainer(options: ContainerOptions): ContainerBuilder {
  const container = new ContainerBuilder();
  if (options.accentColor) {
    container.setAccentColor(options.accentColor);
  }

  for (const component of options.components) {
    // Find the correct handler by checking the component's type against our map.
    for (const [Builder, methodName] of containerComponentHandlerMap.entries()) {
      if (component instanceof Builder) {
        // Dynamically call the correct method (e.g., container.addSectionComponents(component))
        (container[methodName] as (comp: any) => ContainerBuilder)(component);
        break; // Stop searching once the correct handler is found.
      }
    }
  }

  return container;
}

// A union type for all components that can be attached to a Label.
type LabelableComponent =
  | StringSelectMenuBuilder
  | UserSelectMenuBuilder
  | RoleSelectMenuBuilder
  | ChannelSelectMenuBuilder
  | MentionableSelectMenuBuilder
  | TextInputBuilder;

/**
 * Options for creating a Label component.
 */
interface CreateLabelOptions {
  label: string;
  component: LabelableComponent;
  description?: string;
}

// Map that associates a component's constructor with the correct method on LabelBuilder.
const labelComponentHandlerMap = new Map<any, keyof LabelBuilder>([
  [StringSelectMenuBuilder, "setStringSelectMenuComponent"],
  [UserSelectMenuBuilder, "setUserSelectMenuComponent"],
  [RoleSelectMenuBuilder, "setRoleSelectMenuComponent"],
  [ChannelSelectMenuBuilder, "setChannelSelectMenuComponent"],
  [MentionableSelectMenuBuilder, "setMentionableSelectMenuComponent"],
  [TextInputBuilder, "setTextInputComponent"],
]);

/**
 * A simple factory function for creating and configuring a LabelBuilder.
 * Labels are used to group a text label with a single component, like a select menu or text input.
 *
 * @param options The options for the label.
 * @returns A configured LabelBuilder instance.
 */
export function createLabel(options: CreateLabelOptions): LabelBuilder {
  const { label, component, description } = options;

  const labelBuilder = new LabelBuilder().setLabel(label);

  if (description) {
    labelBuilder.setDescription(description);
  }

  // Find the correct handler by checking the component's type against our map.
  for (const [Builder, methodName] of labelComponentHandlerMap.entries()) {
    if (component instanceof Builder) {
      // Dynamically call the correct method
      (labelBuilder[methodName] as (comp: any) => LabelBuilder)(component);
      break; // Stop searching once the correct handler is found.
    }
  }

  return labelBuilder;
}
