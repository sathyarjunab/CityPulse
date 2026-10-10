import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import type { Category } from "../app/generated/prisma/client";

const IST_OFFSET = "+05:30";

// Date `days` from today (IST) at a wall-clock time in IST, so seeded
// events stay "upcoming" or "past" relative to when the seed runs.
function at(days: number, time: string): Date {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
  return new Date(`${date}T${time}:00${IST_OFFSET}`);
}

function image(id: string): string {
  return `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;
}

type SeedEvent = {
  title: string;
  category: Category;
  city: string;
  startsAt: Date;
  price: number;
  description: string;
  imageUrl: string;
  isActive?: boolean;
};

// 15 events: 10 active + upcoming, 2 inactive + upcoming, 3 past (1 inactive).
const events: SeedEvent[] = [
  // Music
  {
    title: "Coimbatore Jazz Night",
    category: "MUSIC",
    city: "Coimbatore",
    startsAt: at(3, "19:30"),
    price: 799,
    description: "An evening of smooth jazz standards and new originals by a five-piece band under the open sky.",
    imageUrl: image("1501281668745-f7f57925c3b4"),
  },
  {
    title: "Indie Rock Live",
    category: "MUSIC",
    city: "Bengaluru",
    startsAt: at(9, "20:00"),
    price: 1499,
    description: "Three of the city's favourite indie bands play back-to-back sets. Standing room only.",
    imageUrl: image("1470229722913-7c0e2dbbafd3"),
  },
  {
    title: "Electronic Beats Festival",
    category: "MUSIC",
    city: "Chennai",
    startsAt: at(-5, "18:00"),
    price: 2499,
    description: "Six hours of electronic music with lasers, visuals and guest DJs.",
    imageUrl: image("1514525253161-7a46d19cd819"),
  },

  // Workshop
  {
    title: "Acrylic Painting for Beginners",
    category: "WORKSHOP",
    city: "Bengaluru",
    startsAt: at(6, "11:00"),
    price: 2500,
    description: "Learn colour mixing, brush control and layering. All materials provided; take your canvas home.",
    imageUrl: image("1513364776144-60967b0f800f"),
  },
  {
    title: "Executive Leadership Bootcamp",
    category: "WORKSHOP",
    city: "Mumbai",
    startsAt: at(14, "09:30"),
    price: 150000,
    description: "A three-day intensive on strategy, communication and leading teams through change.",
    imageUrl: image("1540575467063-178a50c2df87"),
  },
  {
    title: "DIY Craft & Upcycling Workshop",
    category: "WORKSHOP",
    city: "Coimbatore",
    startsAt: at(12, "15:00"),
    price: 1200,
    description: "Turn everyday waste into useful decor. Bring two old jars or bottles.",
    imageUrl: image("1452860606245-08befc0ff44b"),
    isActive: false,
  },

  // Food
  {
    title: "Coimbatore Street Food Night",
    category: "FOOD",
    city: "Coimbatore",
    startsAt: at(5, "18:30"),
    price: 350,
    description: "Twenty stalls of grills, kebabs and local favourites. Entry includes three tasting coupons.",
    imageUrl: image("1555939594-58d7cb561ad1"),
  },
  {
    title: "Farm-to-Table Brunch",
    category: "FOOD",
    city: "Hyderabad",
    startsAt: at(8, "11:30"),
    price: 1800,
    description: "A seasonal brunch menu cooked with produce from farms around the city.",
    imageUrl: image("1504674900247-0877df9cc836"),
  },
  {
    title: "Chef's Table Tasting Evening",
    category: "FOOD",
    city: "Mumbai",
    startsAt: at(-10, "20:00"),
    price: 4500,
    description: "A seven-course tasting menu with the chef explaining each dish.",
    imageUrl: image("1414235077428-338989a2e8c0"),
    isActive: false,
  },

  // Sports
  {
    title: "Chennai 10K Run",
    category: "SPORTS",
    city: "Chennai",
    startsAt: at(20, "05:30"),
    price: 1000,
    description: "A timed 10K along the coast. Includes bib, T-shirt, medal and breakfast.",
    imageUrl: image("1461896836934-ffe607ba8211"),
  },
  {
    title: "Night Football League",
    category: "SPORTS",
    city: "Hyderabad",
    startsAt: at(4, "19:00"),
    price: 500,
    description: "Seven-a-side floodlit matches. Sign up solo and get placed in a team.",
    imageUrl: image("1431324155629-1a6deb1dec8d"),
  },
  {
    title: "Inter-City Swimming Gala",
    category: "SPORTS",
    city: "Bengaluru",
    startsAt: at(-2, "08:00"),
    price: 250,
    description: "Freestyle, backstroke and relay races across age groups.",
    imageUrl: image("1530549387789-4c1017266635"),
  },

  // Kids
  {
    title: "Kids Toy & Game Fair",
    category: "KIDS",
    city: "Chennai",
    startsAt: at(7, "10:00"),
    price: 0,
    description: "Free entry. Try new board games, toys and puzzles, with play zones for every age.",
    imageUrl: image("1566576912321-d58ddd7a6088"),
  },
  {
    title: "Little Artists Colour Day",
    category: "KIDS",
    city: "Mumbai",
    startsAt: at(11, "16:30"),
    price: 299,
    description: "Finger painting, face painting and a mini art show for ages 3–10.",
    imageUrl: image("1503454537195-1dcabb73ffb9"),
  },
  {
    title: "Brick Building Challenge",
    category: "KIDS",
    city: "Hyderabad",
    startsAt: at(15, "11:00"),
    price: 1500,
    description: "Teams of kids build a city from bricks in two hours. Prizes for the most creative builds.",
    imageUrl: image("1587654780291-39c9404d746b"),
    isActive: false,
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: "ADMIN" },
    create: { email, passwordHash, role: "ADMIN" },
  });

  // Recreate events so the seed can be re-run (reminders/card designs cascade).
  await prisma.event.deleteMany();
  await prisma.event.createMany({ data: events });

  console.log(`Seeded admin ${email} and ${events.length} events.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
