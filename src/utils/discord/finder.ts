import {
  CategoryChannel,
  Guild,
  GuildMember,
  Message,
  NewsChannel,
  Role,
  TextChannel,
  User,
  VoiceChannel,
  StageChannel,
  ForumChannel,
  type PublicThreadChannel,
  type PrivateThreadChannel,
  type Channel,
  type Client,
  type MessageComponentInteraction,
  type ModalSubmitInteraction,
  ThreadChannel,
  ChannelType,
} from "discord.js";
import type { CommandContext } from "#discord/modules";

type FinderContext = Client | CommandContext | MessageComponentInteraction | ModalSubmitInteraction;

const channelTypeGuards = {
  text: (ch: Channel): ch is TextChannel => ch.type === ChannelType.GuildText,
  voice: (ch: Channel): ch is VoiceChannel => ch.type === ChannelType.GuildVoice,
  category: (ch: Channel): ch is CategoryChannel => ch.type === ChannelType.GuildCategory,
  news: (ch: Channel): ch is NewsChannel => ch.type === ChannelType.GuildAnnouncement,
  thread: (ch: Channel): ch is PublicThreadChannel<boolean> | PrivateThreadChannel =>
    ch.type === ChannelType.PublicThread ||
    ch.type === ChannelType.PrivateThread ||
    ch.type === ChannelType.AnnouncementThread,
  stage: (ch: Channel): ch is StageChannel => ch.type === ChannelType.GuildStageVoice,
  forum: (ch: Channel): ch is ForumChannel => ch.type === ChannelType.GuildForum,
} as const;

type ChannelTypes = keyof typeof channelTypeGuards;

type ChannelTypeMap = {
  text: TextChannel;
  voice: VoiceChannel;
  category: CategoryChannel;
  news: NewsChannel;
  thread: PublicThreadChannel<boolean> | PrivateThreadChannel;
  stage: StageChannel;
  forum: ForumChannel;
};

type TypedChannel<T extends ChannelTypes> = ChannelTypeMap[T];

/**
 * A modern utility for fetching Discord entities with a fluent and type-safe API.
 *
 * @param context The command context (interaction/message) or a Client instance.
 * @param id The ID of the entity to find.
 * @returns An object with methods to fetch different entities.
 *
 * @example
 * // Simple fetch with a fallback
 * const user = await find(ctx, userId).user() ?? defaultUser;
 *
 * @example
 * // Fetch a specific channel type
 * const textChannel = await find(ctx, channelId).channel("text");
 *
 * @example
 * // Access the cached entity directly (synchronous)
 * const cachedMember = find(ctx, memberId).member(guild).cached;
 */
export function find(context: FinderContext, id: string) {
  const client = "client" in context ? context.client! : context;

  return {
    user: Object.assign(
      async (): Promise<User | null> => {
        try {
          return await client.users.fetch(id);
        } catch {
          return null;
        }
      },
      {
        cached: client.users.cache.get(id),
      },
    ),

    channel: Object.assign(
      (async (type?: ChannelTypes): Promise<Channel | null> => {
        try {
          const channel = await client.channels.fetch(id);
          if (!channel) return null;

          if (type && !channelTypeGuards[type](channel)) {
            return null;
          }

          return channel;
        } catch {
          return null;
        }
      }) as {
        <T extends ChannelTypes>(type: T): Promise<TypedChannel<T> | null>;
        (): Promise<Channel | null>;
      },
      {
        cached: client.channels.cache.get(id),
      },
    ),

    guild: Object.assign(
      async (): Promise<Guild | null> => {
        try {
          return await client.guilds.fetch(id);
        } catch {
          return null;
        }
      },
      {
        cached: client.guilds.cache.get(id),
      },
    ),

    member: (guild: Guild) =>
      Object.assign(
        async (): Promise<GuildMember | null> => {
          try {
            return await guild.members.fetch(id);
          } catch {
            return null;
          }
        },
        {
          cached: guild.members.cache.get(id),
        },
      ),

    role: (guild: Guild) =>
      Object.assign(
        async (): Promise<Role | null> => {
          try {
            return await guild.roles.fetch(id);
          } catch {
            return null;
          }
        },
        {
          cached: guild.roles.cache.get(id),
        },
      ),

    message: (channel: TextChannel | NewsChannel | ThreadChannel) =>
      Object.assign(
        async (): Promise<Message | null> => {
          try {
            return await channel.messages.fetch(id);
          } catch {
            return null;
          }
        },
        {
          cached: channel.messages.cache.get(id),
        },
      ),
  };
}

class FindResult<T> {
  constructor(private promise: Promise<T | null>) {}

  /**
   * Throws an error if the fetched value is null or undefined.
   * @param message The error message to throw.
   * @returns The non-null value.
   */
  async orThrow(message?: string): Promise<T> {
    const value = await this.promise;
    if (value === null || value === undefined) {
      throw new Error(message || "Finder: Entity not found");
    }
    return value;
  }

  /**
   * Returns a fallback value if the fetched value is null or undefined.
   * @param fallback The default value to return.
   * @returns The fetched value or the fallback.
   */
  async or(fallback: T): Promise<T> {
    const value = await this.promise;
    return value ?? fallback;
  }

  then<R>(
    onFulfilled?: ((value: T | null) => R | PromiseLike<R>) | null,
    onRejected?: ((reason: any) => R | PromiseLike<R>) | null,
  ): Promise<R> {
    return this.promise.then(onFulfilled, onRejected);
  }

  catch<R>(onRejected?: ((reason: any) => R | PromiseLike<R>) | null): Promise<T | null | R> {
    return this.promise.catch(onRejected);
  }
}

/**
 * An enhanced version of the finder that supports assertion methods like `.orThrow()` and `.or()`.
 *
 * @param context The command context or a Client instance.
 * @param id The ID of the entity to find.
 * @returns An object with methods that return a `FindResult` instance.
 *
 * @example
 * // Fetch with an assertion, throwing an error if not found
 * const user = await findOr(ctx, userId).user().orThrow("User not found");
 *
 * @example
 * // Fetch with a fallback value
 * const role = await findOr(ctx, roleId).role(guild).or(defaultRole);
 */
export function findOr(context: FinderContext, id: string) {
  const baseFinder = find(context, id);
  return {
    user: () => new FindResult(baseFinder.user()),
    channel: function <T extends ChannelTypes>(type?: T) {
      return new FindResult(baseFinder.channel(type as any));
    } as {
      <T extends ChannelTypes>(type: T): FindResult<TypedChannel<T> | null>;
      (): FindResult<Channel | null>;
    },
    guild: () => new FindResult(baseFinder.guild()),
    member: (guild: Guild) => new FindResult(baseFinder.member(guild)()),
    role: (guild: Guild) => new FindResult(baseFinder.role(guild)()),
    message: (channel: TextChannel | NewsChannel | ThreadChannel) =>
      new FindResult(baseFinder.message(channel)()),
  };
}

/**
 * Fetches multiple entities in parallel.
 *
 * @param context The command context or a Client instance.
 * @param ids An array of IDs to find.
 * @returns An object with methods to fetch multiple entities.
 *
 * @example
 * // Fetch multiple users by their IDs
 * const results = await findMany(ctx, [id1, id2, id3]).users();
 * // Returns: (User | null)[]
 *
 * @example
 * // Fetch multiple members and filter out any that were not found
 * const members = filterNulls(await findMany(ctx, userIds).members(guild));
 * // Returns: GuildMember[]
 */
export function findMany(context: FinderContext, ids: string[]) {
  return {
    users: async (): Promise<(User | null)[]> => {
      return Promise.all(ids.map((id) => find(context, id).user()));
    },
    channels: (async (type?: ChannelTypes): Promise<(Channel | null)[]> => {
      return Promise.all(ids.map((id) => find(context, id).channel(type as any)));
    }) as {
      <T extends ChannelTypes>(type: T): Promise<(TypedChannel<T> | null)[]>;
      (): Promise<(Channel | null)[]>;
    },
    guilds: async (): Promise<(Guild | null)[]> => {
      return Promise.all(ids.map((id) => find(context, id).guild()));
    },
    members: async (guild: Guild): Promise<(GuildMember | null)[]> => {
      return Promise.all(ids.map((id) => find(context, id).member(guild)()));
    },
    roles: async (guild: Guild): Promise<(Role | null)[]> => {
      return Promise.all(ids.map((id) => find(context, id).role(guild)()));
    },
  };
}

/**
 * A type guard utility to filter out null and undefined values from an array.
 *
 * @param array The array to filter.
 * @returns A new array with all nullish values removed.
 *
 * @example
 * const users = filterNulls(await findMany(ctx, ids).users());
 * // Type is now User[] instead of (User | null)[]
 */
export function filterNulls<T>(array: (T | null | undefined)[]): T[] {
  return array.filter((item): item is T => item != null);
}
