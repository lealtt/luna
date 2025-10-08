import { Document } from "mongoose";

/**
 * Represents a user document in the database.
 */
export interface IUser extends Document {
  userId: string;
}
