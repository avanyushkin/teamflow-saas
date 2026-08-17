// серверный компонент, кнопку sign out выносим в другой файл, чтобы не смешивать

import { getServerSession } from "next-auth";
import { authConfig } from "@/app/configs/auth";
import { getMyCards } from "@/app/(cards)/actions";
import { HomeContent } from "@/components/home-content";

export default async function Home() {
    const session = await getServerSession(authConfig);
    const cards = await getMyCards();

    return <HomeContent cards={cards} userName={session?.user?.name} userEmail={session?.user?.email} />;
}
