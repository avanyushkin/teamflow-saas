import { getProfileData, ProfileView } from "@/modules/profile";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
  const profile = await getProfileData();
  if (!profile) {
    return notFound();
  }
  return <ProfileView profile={profile} />;
}
