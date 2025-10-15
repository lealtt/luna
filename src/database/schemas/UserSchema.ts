import { Schema, Model, type UpdateWriteOpResult } from "mongoose";
import {
  Locale,
  userMention,
  type Client,
  type Guild,
  type GuildMember,
  type User,
} from "discord.js";
import { Finder } from "#utils";

export interface IUser extends Document {
  userId: string;
  about: string | null;
  locale: Locale | null;
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
    data: { about?: string | null; locale?: Locale | null },
  ): Promise<UpdateWriteOpResult>;
}

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
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },

    statics: {
      async findOrCreate(this: Model<IUser>, userId: string): Promise<IUser> {
        const user = await this.findOne({ userId });
        return user ?? (await this.create({ userId }));
      },
      updateProfile(
        this: Model<IUser>,
        userId: string,
        data: { about?: string | null; locale?: Locale | null },
      ): Promise<UpdateWriteOpResult> {
        return this.updateOne({ userId }, { $set: data });
      },
    },

    methods: {
      async fetchUser(this: IUser, client: Client): Promise<User | null> {
        return Finder(client, this.userId).user();
      },
      async fetchMember(this: IUser, guild: Guild): Promise<GuildMember | null> {
        return Finder(guild.client, this.userId).member(guild);
      },
    },
  },
);

userSchema.virtual("mention").get(function (this: IUser) {
  return userMention(this.userId);
});
