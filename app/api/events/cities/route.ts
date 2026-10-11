import { connection, NextResponse } from "next/server";
import { listUpcomingCities } from "@/lib/events/queries";

// Cities that currently have upcoming events, for the city filter.
export async function GET() {
  await connection();
  return NextResponse.json({ cities: await listUpcomingCities() });
}
