import { getProfileData } from "@/app/(cards)/actions";
import { notFound } from "next/navigation";

export default async function ProfilePage() {
  const profile = await getProfileData();
  if (!profile) {
    return notFound();
  }
  return (
    <>
      <div className = "p-6 max-w-md mx-auto">
        <h1 className = "text-2xl font-semibold">{profile.firstName} {profile.lastName}</h1>
        <p className = "text-muted-foreground">@{profile.username}</p>
        <p className = "text-muted-foreground">{profile.email}</p>

        <div className = "mt-5 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className = "text-2xl font-semibold">{profile.openCount}</p>
            <p className = "text-sm text-muted-foreground">Current</p>
          </div>
          <div>
            <p className = "text-2xl font-semibold">{profile.closedCount}</p>
            <p className = "text-sm text-muted-foreground">Closed</p>
          </div>
          <div>
            <p className = "text-2xl font-semibold">{profile.adminCount}</p>
            <p className = "text-sm text-muted-foreground">Admin in</p>
          </div>
        </div>
      </div>
    </>
  );
}