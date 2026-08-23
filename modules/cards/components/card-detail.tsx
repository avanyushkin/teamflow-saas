/*
  Бизнес-логика страницы одной карточки (кто владелец, кто админ, кому можно управлять ролями) -
  раньше жила прямо в app/cards/[id]/page.tsx, вынесена сюда, чтобы страница осталась тонкой
  и звала только модуль.
*/
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";
import { MemberRow } from "./member-row";
import type { getCardById } from "../actions";

type Card = NonNullable<Awaited<ReturnType<typeof getCardById>>>;

export function CardDetail({card, currentUserId}: {card: Card; currentUserId?: string}) {
    const isOwner = card.ownerId === currentUserId;
    const isAdmin = card.members.some(
      (member) => member.user.id === currentUserId && member.role === "ADMIN"
    );
    const canManage = isOwner || isAdmin;

    return (
      <div className = "flex min-h-screen">
          <ErrorBoundary fallback = {<p className = "text-sm text-red-500 p-4">Chat failed to load.</p>}>
            <aside className = "w-72 shrink-0 border-r p-4">
              <h2 className = "font-medium mb-2">Team Chat</h2>
              <p className = "text-sm text-muted-foreground">
                Chat is coming soon - real-time messaging will be added later via WebSocket.
              </p>
            </aside>
          </ErrorBoundary>

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
    );
}
