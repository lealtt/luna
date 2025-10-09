import { Document, Model, type UpdateWriteOpResult } from "mongoose";
import type { Client, Guild, GuildMember, User } from "discord.js";

/**
 * Represents a user document in the database.
 */
export interface IUser extends Document {
  userId: string;
  about: string | null;

  // Timestamp properties added by Mongoose
  createdAt: Date;
  updatedAt: Date;

  /**
   * Fetches the discord.js User object corresponding to this document.
   * @param client The bot's Client instance.
   */
  fetchUser(client: Client): Promise<User | null>;

  /**
   * Fetches the GuildMember object corresponding to this user in a specific guild.
   * @param guild The guild to fetch the member from.
   */
  fetchMember(guild: Guild): Promise<GuildMember | null>;

  /**
   * The formatted Discord mention for this user.
   */
  readonly mention: string;
}

/**
 * Represents the User Model, containing static methods.
 */
export interface IUserModel extends Model<IUser> {
  /**
   * Finds a user by their ID, or creates a new one if not found.
   * @param userId The Discord user ID.
   * @returns The found or newly created user document.
   */
  findOrCreate(userId: string): Promise<IUser>;

  /**
   * Updates a user's profile information.
   * @param userId The ID of the user to update.
   * @param data The data to update.
   */
  updateProfile(userId: string, data: { about: string | null }): Promise<UpdateWriteOpResult>;
}
