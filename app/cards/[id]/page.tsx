/*
  Серверная компонента. Загружает конкретную карточку, узнает кто сейчас смотрит страницу и решает - может 
  ли именно этот пользователь управлять роляими
*/
import {getCardById} from "@/app/(cards)/actions";
import {notFound} from "next/navigation";
import { getServerSession } from "next-auth";
import {authConfig} from "@/app/configs/auth";
import { MemberRow } from "@/components/member-row";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function CardPage({params}: {params: Promise<{id: string}>}) {
    const {id} = await params;
    const card = await getCardById(id);

    if (!card) {
        notFound();
    }

    const session = await getServerSession(authConfig);
    const isOwner = card.ownerId === session?.user?.id;
    const isAdmin = card.members.some(
      (member) => member.user.id === session?.user?.id && member.role === "ADMIN"
    );
    const canManage = isOwner || isAdmin;

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
            <Link href = "/">
              <Button variant = "ghost" size = "sm" className = "mb-4">
                Back to Home
              </Button>
            </Link>
            <h1 className = "text-2xl font-semibold">{card.title}</h1>
            <p className = "text-muted-foreground">{card.description}</p>
            <p>Status: {card.status}</p>

            <h2 className = "mt-6 font-medium">Owner</h2>
            <p>{card.owner.firstName} {card.owner.lastName} ({card.owner.username})</p>
            <h2 className = "mt-6 font-medium">Members</h2>
            <ul className = "flex flex-col gap-2">
              {card.members.map((member) => (
                <MemberRow key = {member.user.id} cardId = {card.id} member = {member} canManage = {canManage}/>
              ))}
            </ul>
          </div>
        </div>
      </>
    );
}