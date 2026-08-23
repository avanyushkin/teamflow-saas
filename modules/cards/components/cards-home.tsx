"use client";

import { useRef, lazy, Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { UserMenu } from "@/components/user-menu";
import { CardsBoard } from "./cards-board";
import { ScrollViewHandle } from "@/components/scroll-view";
import type { getMyCards } from "../actions";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/error-boundary";

const CardDialog = lazy(() => import("./create-card-dialog"));
type MyCards = Awaited<ReturnType<typeof getMyCards>>;

export function CardsHome({
    cards,
    userName,
    userEmail,
}: {
    cards: MyCards;
    userName?: string | null;
    userEmail?: string | null;
}) {
    const scrollViewRef = useRef<ScrollViewHandle>(null);

    return (
        <>
            <div className="flex items-center justify-between p-4">
                <div>
                    <p>Welcome, {userName}</p>
                    <p>{userEmail}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Suspense fallback = {<Button disabled>Loading...</Button>}>
                      <CardDialog onCreated={() => scrollViewRef.current?.scrollToTop()} />
                    </Suspense>
                    <SignOutButton />
                    <UserMenu name={userName} />
                </div>
            </div>

            <ErrorBoundary fallback = {<p className = "p-4 text-sm text-red-500">Something went wrong loading the cards.</p>}>
              <CardsBoard cards={cards} scrollViewRef={scrollViewRef} />
            </ErrorBoundary>
        </>
    );
}
