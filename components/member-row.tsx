"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateMemberRole } from "@/app/(cards)/actions";
import { Loader2 } from "lucide-react";

type Member = {
    role: "ADMIN" | "MEMBER";
    user: { id: string; username: string; firstName: string; lastName: string };
};

export function MemberRow({ cardId, member, canManage }: { cardId: string; member: Member; canManage: boolean }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);

    async function toggleRole() {
        setPending(true);
        const newRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
        await updateMemberRole(cardId, member.user.id, newRole);
        setPending(false);
        router.refresh();
    }

    return (
        <li className="flex items-center justify-between gap-2">
            <span>{member.user.firstName} {member.user.lastName} — {member.role}</span>
            {canManage && (
                <Button size="sm" variant="outline" disabled={pending} onClick={toggleRole}>
                    {pending ? (
                        <Loader2 className = "size-4 animate-spin " />
                    ) : member.role === "ADMIN" ? (
                        "Demote"
                    ) : ("Promote")}
                </Button>
            )}
        </li>
    );
}
