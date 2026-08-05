import {getCardById} from "@/app/(cards)/actions";
import {notFound} from "next/navigation";

export default async function CardPage({params}: {params: Promise<{id: string}>}) {
    const {id} = await params;
    const card = await getCardById(id);

    if (!card) {
        notFound();
    }

    return (
      <>
        <div className = "flex min-h-screen">
            <aside className = "w-72 shrink-0 border-r p-4">
              <h2 className = "font-medium mb-2">Team Chat</h2>
              <p className = "text-sm text-muted-foreground">
                Chat is coming soon - real-time messaging will be added later via WebSocket.
              </p>
            </aside>
          
          <div className = "p-6 flex-1">
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
        </div>
      </>
    );
}