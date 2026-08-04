// серверный компонент, кнопку sign out выносим в другой файл, чтобы не смешивать

import { getServerSession } from "next-auth";
import { authConfig } from "@/app/configs/auth";
import { SignOutButton } from "@/components/sign-out-button";
import CardDialog from "@/components/create-card-dialog";
import { getMyCards } from "@/app/(cards)/actions";
import { TaskCard } from "@/components/task-card"
import { CardsBoard } from "@/components/cards-board";

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

      <CardsBoard cards = {cards} />
    </>
  );
}