import { z } from "zod";
import { CardTheme, Sticker } from "@/app/generated/prisma/enums";
import { MAX_STICKERS } from "@/lib/card";

export const cardDesignSchema = z.object({
  theme: z.enum(CardTheme, { error: "Pick one of the three themes." }),
  stickers: z
    .array(z.enum(Sticker, { error: "Unknown sticker." }), { error: "stickers must be a list." })
    .max(MAX_STICKERS, { error: `A card can have up to ${MAX_STICKERS} stickers.` }),
});
