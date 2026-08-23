import { getCurrentSession } from "@/lib/auth";
import { getMyCards, CardsHome } from "@/modules/cards";

export default async function Home() {
    const session = await getCurrentSession();
    const cards = await getMyCards();

    return <CardsHome cards={cards} userName={session?.user?.name} userEmail={session?.user?.email} />;
}
