import { z } from "zod";

export function firstFieldErrors(error: z.ZodError): Record<string, string> {
  const { fieldErrors } = z.flattenError(error);
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(
        (entry): entry is [string, string[]] =>
          Array.isArray(entry[1]) && entry[1].length > 0,
      )
      .map(([field, messages]) => [field, messages[0]]),
  );
}
