import mongoose, { model, type ConnectOptions } from "mongoose";
import { env, logger } from "#utils";
import type { IUser } from "./documents/UserDocument.js";
import { type IUserModel, userSchema } from "./schemas/UserSchema.js";

const connectionOptions: ConnectOptions = {
  dbName: "myDatabase",
  ...(env.MONGO_CERTIFICATE_PATH && {
    tls: true,
    tlsCertificateKeyFile: env.MONGO_CERTIFICATE_PATH,
    tlsCAFile: env.MONGO_CERTIFICATE_PATH,
  }),
};

try {
  await mongoose.connect(env.MONGO_URI!, connectionOptions);
  logger.database("Successfully connected to Mongo.");
} catch (error) {
  logger.error("Failed to connect to MongoDB:", error);
  process.exit(1);
}

export const models = {
  users: model<IUser, IUserModel>("User", userSchema),
};
