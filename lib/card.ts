import type { CardTheme, Sticker } from "@/app/generated/prisma/enums";

export const MAX_STICKERS = 3;

export type CardDesignDTO = { theme: CardTheme; stickers: Sticker[] };

export const DEFAULT_DESIGN: CardDesignDTO = { theme: "SUNSET", stickers: [] };

type ThemeMeta = {
  value: CardTheme;
  label: string;
  background: string;
  text: string;
  muted: string;
};

export const CARD_THEMES: readonly ThemeMeta[] = [
  {
    value: "SUNSET",
    label: "Sunset",
    background: "bg-[linear-gradient(140deg,#ffb36b_0%,#ff8a3d_35%,#ff5fa2_100%)]",
    text: "text-ink",
    muted: "text-ink/75",
  },
  {
    value: "OCEAN",
    label: "Ocean",
    background: "bg-[linear-gradient(140deg,#9ee6ff_0%,#46c2ff_40%,#7b5cff_100%)]",
    text: "text-ink",
    muted: "text-ink/75",
  },
  {
    value: "MIDNIGHT",
    label: "Midnight",
    background:
      "bg-ink bg-[radial-gradient(circle_at_85%_15%,rgb(200_241_53/0.35),transparent_40%),radial-gradient(circle_at_10%_90%,rgb(255_95_162/0.35),transparent_45%)]",
    text: "text-paper",
    muted: "text-paper/70",
  },
];

export const CARD_THEME_META = Object.fromEntries(CARD_THEMES.map((theme) => [theme.value, theme])) as Record<
  CardTheme,
  ThemeMeta
>;

export const STICKERS: readonly { value: Sticker; emoji: string; label: string }[] = [
  { value: "PARTY", emoji: "🎉", label: "Party popper" },
  { value: "MUSIC", emoji: "🎵", label: "Music note" },
  { value: "HEART", emoji: "💖", label: "Sparkling heart" },
  { value: "STAR", emoji: "⭐", label: "Star" },
  { value: "FIRE", emoji: "🔥", label: "Fire" },
];

export const STICKER_META = Object.fromEntries(STICKERS.map((sticker) => [sticker.value, sticker])) as Record<
  Sticker,
  (typeof STICKERS)[number]
>;
