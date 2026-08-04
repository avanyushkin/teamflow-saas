"use client";

import { getMyCards } from "@/app/(cards)/actions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";

type MyCards = Awaited<ReturnType<typeof getMyCards>>;

export function CardsBoard({cards}: {cards: MyCards}) {
  const [query, setQuery] = useState("");

  const filteredCards = cards.filter((card) => (
    card.title.toLowerCase().includes(query.toLowerCase())
  ));

  return (
    <div>
      <div className = "p-4 border-b">
        <Input placeholder = "Search cards..." value = {query} onChange = {(e) => setQuery(e.target.value)} />
      </div>
      <div className = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {filteredCards.map((card) => (
            <TaskCard key = {card.id} card = {card}/>
        ))}
      </div>
    </div>
  );
}