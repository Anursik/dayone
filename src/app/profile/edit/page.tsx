import type { Metadata } from "next";
import { ProfileEditScreen } from "@/components/profile/profile-edit-screen";

export const metadata: Metadata = { title: "Профиль и цели · DAYONE" };

export default function Page() {
  return <ProfileEditScreen />;
}
