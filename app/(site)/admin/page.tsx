import type { Metadata } from "next";
import { AdminEvents } from "@/components/admin/admin-events";

export const metadata: Metadata = { title: "Admin" };

export default function AdminPage() {
  return <AdminEvents />;
}
