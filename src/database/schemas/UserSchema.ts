import { Model, Schema } from "mongoose";
import type { IUser } from "../documents/UserDocument.js";

export interface IUserModel extends Model<IUser> {
  findOrCreate(userId: string): Promise<IUser>;
}

export const userSchema = new Schema<IUser, IUserModel>(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
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
    },
  },
);
