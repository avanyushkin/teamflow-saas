"use client";

import { useRef, lazy, Suspense } from "react";
// import CardDialog from "@/components/create-card-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import { UserMenu } from "@/components/user-menu";
import { CardsBoard } from "@/components/cards-board";
import { ScrollViewHandle } from "@/components/scroll-view";
import { getMyCards } from "@/app/(cards)/actions";
import { Button } from "@/components/ui/button";

const CardDialog = lazy(() => import("@/components/create-card-dialog"));
type MyCards = Awaited<ReturnType<typeof getMyCards>>;

export function HomeContent({
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

            <CardsBoard cards={cards} scrollViewRef={scrollViewRef} />
        </>
    );
}
