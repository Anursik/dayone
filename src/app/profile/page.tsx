import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = { title: "Профиль · DAYONE" };

export default function Page() {
  return <ProfileScreen />;
}
