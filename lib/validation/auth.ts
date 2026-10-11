import { z } from "zod";

const email = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().toLowerCase() : value),
  z.email({ error: "Enter a valid email address." }),
);

export const signupSchema = z.object({
  email,
  password: z
    .string({ error: "Enter a password." })
    .min(8, { error: "Use at least 8 characters." })
    .max(72, { error: "Use 72 characters or fewer." }),
});

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Enter your password." })
    .min(1, { error: "Enter your password." })
    .max(72, { error: "Wrong email or password." }),
});

export type Credentials = z.infer<typeof signupSchema>;
