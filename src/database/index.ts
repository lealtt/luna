import mongoose, { model, type ConnectOptions } from "mongoose";
import { logger } from "#utils";
import { userSchema } from "./schemas/UserSchema.js";
import type { IUser, IUserModel } from "./documents/UserDocument.js";
import { env } from "#env";

export async function connectToDatabase(): Promise<void> {
  const connectionOptions: ConnectOptions = {
    dbName: "myDatabase",
    ...(env.MONGO_CERTIFICATE_PATH && {
      tls: true,
      tlsCertificateKeyFile: env.MONGO_CERTIFICATE_PATH,
      tlsCAFile: env.MONGO_CERTIFICATE_PATH,
    }),
  };

  try {
    await mongoose.connect(env.MONGO_URI, connectionOptions);
    logger.database("Successfully connected to Mongo.");
  } catch (error) {
    logger.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

interface IModels {
  users: IUserModel;
}

export const models: IModels = {
  users: model<IUser, IUserModel>("User", userSchema),
};

export type { IUser, IUserModel };
