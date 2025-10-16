import { Schema, Model, type Document, type UpdateWriteOpResult } from "mongoose";
import {
  Locale,
  userMention,
  type Client,
  type Guild,
  type GuildMember,
  type User,
} from "discord.js";
import { find, logger } from "#utils";
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
        return this.updateOne({ userId }, { $set: data });
      },
    },

    methods: {
      async fetchUser(this: IUser, client: Client): Promise<User | null> {
        try {
          return await find(client, this.userId).user();
        } catch (error) {
          logger.error(`Failed to fetch user ${this.userId}:`, error);
          return null;
        }
      },
      async fetchMember(this: IUser, guild: Guild): Promise<GuildMember | null> {
        try {
          return await find(guild.client, this.userId).member(guild)();
        } catch (error) {
          logger.error(`Failed to fetch member ${this.userId} in guild ${guild.id}:`, error);
          return null;
        }
      },
    },
  },
);

userSchema.virtual("mention").get(function (this: IUser) {
  return userMention(this.userId);
});
