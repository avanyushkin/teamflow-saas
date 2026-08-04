import {getCardById} from "@/app/(cards)/actions";
import {notFound} from "next/navigation";

export default async function CardPage({params}: {params: Promise<{id: string}>}) {
    const {id} = await params;
    const card = await getCardById(id);

    if (!card) {
        notFound();
    }

    return (
      <div className = "p-6">
        <h1 className = "text-2xl font-semibold">{card.title}</h1>
        <p className = "text-muted-foreground">{card.description}</p>
        <p>Status: {card.status}</p>

        <h2 className = "mt-6 font-medium">Owner</h2>
        <p>{card.owner.firstName} {card.owner.lastName} ({card.owner.username})</p>
        <h2 className = "mt-6 font-medium">Members</h2>
        <ul>
          {card.members.map((member) => (
            <li key = {member.user.id}>
                {member.user.firstName} {member.user.lastName} - {member.role}
            </li>
          ))}
        </ul>
      </div>
    );
}