import { Locale } from "discord.js";
import { enUS } from "./en-US.js";
import { ptBR } from "./pt-BR.js";
import { esES } from "./es-ES.js";

export const translations = {
  [Locale.EnglishUS]: enUS,
  [Locale.PortugueseBR]: ptBR,
  [Locale.SpanishES]: esES,
} as const;

export type AppTranslations = typeof enUS;

export { enUS, ptBR, esES };
