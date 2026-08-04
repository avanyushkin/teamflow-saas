// серверный компонент, кнопку sign out выносим в другой файл, чтобы не смешивать

import { getServerSession } from "next-auth";
import { authConfig } from "@/app/configs/auth";
import { SignOutButton } from "@/components/sign-out-button";
import CardDialog from "@/components/create-card-dialog";
import { getMyCards } from "@/app/(cards)/actions";
import { TaskCard } from "@/components/task-card"

export default async function Home() {
  const session = await getServerSession(authConfig);
  const cards = await getMyCards();

  return (
    <>
      <div>
        <p>Welcome, {session?.user?.name}</p>
        <p>{session?.user?.email}</p>
        <SignOutButton />
        <CardDialog />
      </div>

      <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {
          cards.map((card) => (
            <TaskCard key = {card.id} card = {card}/>
          ))
        }
      </div>
    </>
  );
}