"use client";

import { getMyCards } from "@/app/(cards)/actions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TaskCard } from "@/components/task-card";
import { useEffect } from "react";
import { LevenshteinDistance } from "@/lib/levenshtein";

type MyCards = Awaited<ReturnType<typeof getMyCards>>;

function isFuzzyMatch(title: string, query: string): boolean {
  if (!query) {
    return true;
  }

  const lowerTitle = title.toLowerCase();
  const lowerQuery = query.toLowerCase();

  if (lowerTitle.includes(lowerQuery)) {
    return true;
  }

  const threshold = Math.max(1, Math.floor(lowerQuery.length * 0.3));

  return lowerTitle.split(" ").some((word) => LevenshteinDistance(word, lowerQuery) <= threshold);
}

export function CardsBoard({cards}: {cards: MyCards}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const filteredCards = cards.filter((card) => (
    isFuzzyMatch(card.title, debouncedQuery)
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