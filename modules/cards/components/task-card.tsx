/*
  серверная компонента, показывает статус, владельца, количество участников карточки
*/

import type { getMyCards } from "../actions";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import Link from "next/link";

type MyCard = Awaited<ReturnType<typeof getMyCards>>[number];

export function TaskCard({card}: {card: MyCard}) {
  return (
    <>
      <Link href={`/cards/${card.id}`} data-scroll-id={card.id}>
        <Card className = "min-h-[220px] shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle>{card.title}</CardTitle>
          </CardHeader>
          <CardContent className = "flex flex-col gap-2">
            <span className = "text-sm text-muted-foreground">
              Owner: {card.owner.username}
            </span>
            <span className = "text-sm text-muted-foreground">
              Status: {card.status}
            </span>
            <span className = "text-sm text-muted-foreground">
              Members: {card.members.length}
            </span>
          </CardContent>
        </Card>
      </Link>
    </>
  );
}
