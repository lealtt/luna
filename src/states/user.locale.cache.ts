import { kfeat } from "@lealt/kaori";
import type { AppLocales } from "#translate";

export const userLocaleCache = kfeat.state.define<AppLocales | null>({
  id: "user-locales",
  ttl: kfeat.timer.create(15).min(),
  maxSize: 10000,
});
