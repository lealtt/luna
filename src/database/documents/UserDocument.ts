import type { Model, Document, UpdateWriteOpResult } from "mongoose";
import type { Client, Guild, GuildMember, User } from "discord.js";

export interface IUser extends Document {
  userId: string;
  about: string | null;
  locale: string | null;
  createdAt: Date;
  updatedAt: Date;
  fetchUser(client: Client): Promise<User | null>;
  fetchMember(guild: Guild): Promise<GuildMember | null>;
  readonly mention: string;
}

export interface IUserModel extends Model<IUser> {
  findOrCreate(userId: string): Promise<IUser>;
  updateProfile(
    userId: string,
    data: { about?: string | null; locale?: string | null },
  ): Promise<UpdateWriteOpResult>;
}
