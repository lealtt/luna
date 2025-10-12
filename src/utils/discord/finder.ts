import {
  CategoryChannel,
  Guild,
  GuildMember,
  Message,
  NewsChannel,
  Role,
  TextChannel,
  ThreadChannel,
  User,
  VoiceChannel,
  type Channel,
  type Client,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
} from "discord.js";
import type { CommandContext } from "#discord/modules";

type FinderContext = Client | CommandContext | MessageComponentInteraction | ModalSubmitInteraction;

/**
 * A custom Promise class with additional chainable assertion methods.
 */
class FinderPromise<T> extends Promise<T> {
  constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void) {
    super(executor);
  }

  /**
   * Asserts that the found value is not null or undefined.
   * Throws an error if the value is null, otherwise returns the value.
   */
  async notNull(): Promise<NonNullable<T>> {
    const value = await this;
    if (value === null || value === undefined) {
      throw new Error("Finder assertion failed: value is null or undefined.");
    }
    return value;
  }

  /**
   * Asserts that the found value is null or undefined.
   * Returns the value if it is null/undefined, otherwise returns null.
   */
  async isNull(): Promise<null | undefined> {
    const value = await this;
    if (value === null) return null;
    if (value === undefined) return undefined;
    return null; // The original promise resolved to a non-nullish value.
  }

  /**
   * Asserts the found entity is a TextChannel.
   * Resolves to the channel if true, or null if it's not a TextChannel.
   */
  textChannel(): FinderPromise<TextChannel | null> {
    return new FinderPromise(async (resolve) => {
      const value = (await this) as Channel | null;
      resolve(value instanceof TextChannel ? value : null);
    });
  }

  /**
   * Asserts the found entity is a VoiceChannel.
   * Resolves to the channel if true, or null if it's not a VoiceChannel.
   */
  voiceChannel(): FinderPromise<VoiceChannel | null> {
    return new FinderPromise(async (resolve) => {
      const value = (await this) as Channel | null;
      resolve(value instanceof VoiceChannel ? value : null);
    });
  }

  /**
   * Asserts the found entity is a CategoryChannel.
   * Resolves to the channel if true, or null if it's not a CategoryChannel.
   */
  categoryChannel(): FinderPromise<CategoryChannel | null> {
    return new FinderPromise(async (resolve) => {
      const value = (await this) as Channel | null;
      resolve(value instanceof CategoryChannel ? value : null);
    });
  }

  /**
   * Asserts the found entity is a NewsChannel.
   * Resolves to the channel if true, or null if it's not a NewsChannel.
   */
  newsChannel(): FinderPromise<NewsChannel | null> {
    return new FinderPromise(async (resolve) => {
      const value = (await this) as Channel | null;
      resolve(value instanceof NewsChannel ? value : null);
    });
  }

  /**
   * Asserts the found entity is a ThreadChannel.
   * Resolves to the channel if true, or null if it's not a ThreadChannel.
   */
  threadChannel(): FinderPromise<ThreadChannel | null> {
    return new FinderPromise(async (resolve) => {
      const value = (await this) as Channel | null;
      resolve(value instanceof ThreadChannel ? value : null);
    });
  }
}

/**
 * A wrapper for the result of a synchronous fetch, allowing the use of .notNull().
 */
class SyncWrapper<T> {
  public readonly value: T | undefined;

  constructor(value: T | undefined) {
    this.value = value;
  }

  /**
   * Asserts that the synchronously found value is not null or undefined.
   * Throws an error if the value is null, otherwise returns the value.
   */
  notNull(): T {
    if (this.value === null || this.value === undefined) {
      throw new Error("Finder assertion failed: value is null or undefined.");
    }
    return this.value;
  }
}

/**
 * Handles the logic for synchronous (cache-only) lookups.
 */
class SyncFinderFactory {
  private client: Client;
  private id: string;

  constructor(client: Client, id: string) {
    this.client = client;
    this.id = id;
  }

  user(): SyncWrapper<User> {
    return new SyncWrapper(this.client.users.cache.get(this.id));
  }

  channel(): SyncWrapper<Channel> {
    return new SyncWrapper(this.client.channels.cache.get(this.id));
  }

  guild(): SyncWrapper<Guild> {
    return new SyncWrapper(this.client.guilds.cache.get(this.id));
  }

  member(guild: Guild): SyncWrapper<GuildMember> {
    return new SyncWrapper(guild.members.cache.get(this.id));
  }

  role(guild: Guild): SyncWrapper<Role> {
    return new SyncWrapper(guild.roles.cache.get(this.id));
  }
}

/**
 * Handles the logic for fetching Discord entities.
 */
class FinderFactory {
  private client: Client;
  private id: string;

  constructor(context: FinderContext, id: string) {
    this.client = "client" in context ? context.client! : context;
    this.id = id;
  }

  /**
   * Accesses synchronous cache-only methods.
   */
  sync(): SyncFinderFactory {
    return new SyncFinderFactory(this.client, this.id);
  }

  /**
   * Finds a user by ID.
   */
  user(): FinderPromise<User | null> {
    return new FinderPromise(async (resolve) => {
      try {
        const user = await this.client.users.fetch(this.id);
        resolve(user);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Finds any channel by ID from the client's cache or API.
   */
  channel(): FinderPromise<Channel | null> {
    return new FinderPromise(async (resolve) => {
      try {
        const channel = await this.client.channels.fetch(this.id);
        resolve(channel);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Finds a guild (server) by ID.
   */
  guild(): FinderPromise<Guild | null> {
    return new FinderPromise(async (resolve) => {
      try {
        const guild = await this.client.guilds.fetch(this.id);
        resolve(guild);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Finds a specific message within a given channel.
   */
  message(channel: TextChannel | NewsChannel | ThreadChannel): FinderPromise<Message | null> {
    return new FinderPromise(async (resolve) => {
      try {
        const message = await channel.messages.fetch(this.id);
        resolve(message);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Finds a guild member by ID. Requires a guild context.
   */
  member(guild: Guild): FinderPromise<GuildMember | null> {
    return new FinderPromise(async (resolve) => {
      try {
        const member = await guild.members.fetch(this.id);
        resolve(member);
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Finds a role by ID. Requires a guild context.
   */
  role(guild: Guild): FinderPromise<Role | null> {
    return new FinderPromise(async (resolve) => {
      try {
        const role = await guild.roles.fetch(this.id);
        resolve(role);
      } catch {
        resolve(null);
      }
    });
  }
}

/**
 * A utility for finding Discord entities by ID with a fluent, chainable API.
 *
 * @param context The command context (interaction/message) or a Client instance.
 * @param id The ID of the entity to find.
 * @returns A FinderFactory instance to chain search methods from.
 *
 * @example
 * // Async with assertion
 * const user = await Finder(interaction, userId).user().notNull();
 *
 * // Sync with assertion
 * const cachedMember = Finder(interaction, memberId).sync().member(interaction.guild).notNull();
 *
 * // Sync without assertion
 * const maybeRole = Finder(interaction, roleId).sync().role(interaction.guild).value;
 */
export function Finder(context: FinderContext, id: string) {
  return new FinderFactory(context, id);
}
