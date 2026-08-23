"use client";

import type { getMyCards } from "../actions";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { TaskCard } from "./task-card";
import { useEffect } from "react";
import { LevenshteinDistance } from "../utils/levenshtein";
import { useTransition, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { ScrollView, ScrollViewHandle } from "@/components/scroll-view";
import { RefObject } from "react";

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

export function CardsBoard({cards, scrollViewRef}: {cards: MyCards; scrollViewRef: RefObject<ScrollViewHandle | null>}) {
  // throw new Error("Test: CardsBoard crashed");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isPending, startSearchTransition] = useTransition();

  const [statusFilter, setStatusFilter] = useState<"ALL" | "OPEN" | "CLOSED">("ALL");

  function handleStatusChange(status: "ALL" | "OPEN" | "CLOSED") {
    startTransition(() => {
      setStatusFilter(status);
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      startSearchTransition(() => {
        setDebouncedQuery(query);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const filteredCards = cards
    .filter((card) => statusFilter === "ALL" || card.status === statusFilter)
    .filter((card) => (isFuzzyMatch(card.title, debouncedQuery)));

  return (
    <div>
      <div className = "p-4 border-b">
        <Input placeholder = "Search cards..." value = {query} onChange = {(e) => setQuery(e.target.value)} />
        {isPending && <span className = "text-xs text-muted-foreground">Updating...</span>}
      </div>
      <div className = "flex gap-2 p-4">
        {(["ALL", "OPEN", "CLOSED"] as const).map((status) => (
          <Button key = {status} size = "sm" variant = {statusFilter === status ? "default" : "outline"}
            onClick = {() => handleStatusChange(status)}>{status}</Button>
        ))}
      </div>
      <ScrollView ref = {scrollViewRef} className = "grid grid-cols-1 sm:grid-cols-2 gap-8 p-8">
        {filteredCards.map((card) => (
            <TaskCard key = {card.id} card = {card}/>
        ))}
      </ScrollView>
    </div>
  );
}
