import { Schema, type Model, type UpdateWriteOpResult } from "mongoose";
import { Locale, type Client, type Guild, type GuildMember, type User } from "discord.js";
import { logger } from "#utils";
import type { IUser, IUserModel } from "../documents/UserDocument.js";

const validLocales = Object.values(Locale);

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
    locale: {
      type: String,
      default: null,
      validate: {
        validator: (value: string | null) =>
          value === null || validLocales.includes(value as Locale),
        message: (props) => `${props.value} is not a valid Discord locale`,
      },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

    statics: {
      async findOrCreate(this: Model<IUser>, userId: string): Promise<IUser> {
        return this.findOneAndUpdate(
          { userId },
          { $setOnInsert: { userId } },
          { upsert: true, new: true },
        );
      },
      async updateProfile(
        this: Model<IUser>,
        userId: string,
        data: { about?: string | null; locale?: string | null },
      ): Promise<UpdateWriteOpResult> {
        return this.updateOne({ userId }, { $set: data }, { upsert: true });
      },
    },

    methods: {
      async fetchUser(this: IUser, client: Client): Promise<User | null> {
        try {
          return await client.users.fetch(this.userId);
        } catch (error) {
          logger.error(`Failed to fetch user ${this.userId}:`, error);
          return null;
        }
      },
      async fetchMember(this: IUser, guild: Guild): Promise<GuildMember | null> {
        try {
          return await guild.members.fetch(this.userId);
        } catch (error) {
          logger.error(`Failed to fetch member ${this.userId} in guild ${guild.id}:`, error);
          return null;
        }
      },
    },
  },
);
