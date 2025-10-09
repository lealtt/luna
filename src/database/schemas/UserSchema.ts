import { Schema } from "mongoose";
import type { IUser, IUserModel } from "../documents/UserDocument.js";
import { userMention, type Client, type Guild, type GuildMember, type User } from "discord.js";
import { Finder } from "#utils";

export const userSchema = new Schema<IUser, IUserModel>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    about: {
      type: String,
      default: null,
      maxlength: 200,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

    statics: {
      /**
       * Finds a user by their ID, or creates a new one if not found.
       * @param userId The Discord user ID.
       * @returns The found or newly created user document.
       */
      async findOrCreate(userId: string): Promise<IUser> {
        const user = await this.findOne({ userId });
        return user ?? (await this.create({ userId }));
      },

      /**
       * Updates a user's profile information in the database.
       * @param userId The ID of the user to update.
       * @param data An object containing the profile data to set.
       * @returns The result of the update operation.
       */
      updateProfile(userId: string, data: { about: string | null }) {
        return this.updateOne({ userId }, { $set: data });
      },
    },

    methods: {
      /**
       * Fetches the full discord.js User object for this document.
       * @param {Client} client The Discord client instance.
       * @returns {Promise<User | null>} The User object, or null if not found.
       */
      async fetchUser(this: IUser, client: Client): Promise<User | null> {
        return Finder(client, this.userId).user();
      },

      /**
       * Fetches the full discord.js GuildMember object for this document in a specific guild.
       * @param {Guild} guild The guild to fetch the member from.
       * @returns {Promise<GuildMember | null>} The GuildMember object, or null if not found.
       */
      async fetchMember(this: IUser, guild: Guild): Promise<GuildMember | null> {
        return Finder(guild.client, this.userId).member(guild);
      },
    },
  },
);

/**
 * A virtual property to get the formatted Discord mention string for the user.
 * This is a getter that computes the value on access and is not stored in the database.
 * @returns {string} The user mention string (e.g., "<@12345>").
 */
userSchema.virtual("mention").get(function (this: IUser) {
  return userMention(this.userId);
});
