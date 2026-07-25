/*
что должна делать:
1. проверить, что пользователь залогинен
2. Ревалидировать данные
3. Создать Card и CardMember вместе, одной транзакцией.
*/

"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/app/configs/auth";
import { formSchemaCard } from "./zod-schemas/card";
import z from "zod";

type CreateCardResult = {ok: true} | {ok: false; message: string};

export async function createCard(values: z.infer<typeof formSchemaCard>): Promise<CreateCardResult> {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return {ok: false, message: "Not authenticated"};
  }

  const parsed = formSchemaCard.safeParse(values);
  if (!parsed.success) {
    return {ok: false, message: parsed.error.issues[0].message };
  }

  await prisma.$transaction(async (tx) => {
    const card = await tx.card.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        ownerId: session.user.id,
      },
    });

    await tx.cardMember.create({
        data: {
            cardId: card.id,
            userId: session.user.id,
            role: "ADMIN",
        },
    });
  });

  return {ok: true};
}