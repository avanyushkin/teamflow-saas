import { getCardById, CardDetail } from "@/modules/cards";
import { notFound } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function CardPage({params}: {params: Promise<{id: string}>}) {
    const {id} = await params;
    const card = await getCardById(id);

    if (!card) {
        notFound();
    }

    const session = await getCurrentSession();

    return <CardDetail card={card} currentUserId={session?.user?.id} />;
}
