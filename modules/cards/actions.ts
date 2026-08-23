/*
что должна делать:
1. проверить, что пользователь залогинен
2. Ревалидировать данные
3. Создать Card и CardMember вместе, одной транзакцией.
*/

"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";
import { formSchemaCard } from "./schemas";
import z from "zod";

type CreateCardResult = {ok: true} | {ok: false; message: string};

export async function createCard(values: z.infer<typeof formSchemaCard>): Promise<CreateCardResult> {
  const session = await getCurrentSession();
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

    if (parsed.data.memberIds.length > 0) {
      await tx.cardMember.createMany({
          data: parsed.data.memberIds.map((userId) => ({
            cardId: card.id,
            userId,
            role: "MEMBER",
          }))
      });
    }
  });

  return {ok: true};
}

export async function getUsers() {
  const session = await getCurrentSession();
  return prisma.user.findMany({
    where: session?.user?.id ? {id: { not: session.user.id}} : {}, // исключаем самого себя из списка, тк я и так владелец каточки
    select: {id: true, username: true, firstName: true, lastName: true}, // берем только то, что нужно для отображения в списке
                                                                         // (не тащим password / email и прочее лишнее на клиент)

  })
}

export async function getMyCards() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.card.findMany({ // поиск всех карточек, где я владелец либо участник
    where: {
      OR: [
        {ownerId: session.user.id},
        {members: {some: {userId: session.user.id}}},
      ],
    },
    include: {
      owner: { select: {username: true}},
      members: {select: {userId: true, role: true}},
    },
    orderBy: {createdAt: "desc"},
  });
}

export async function getCardById(id: string) {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return null;
  }

  const card = await prisma.card.findUnique({ // findUnique - ищем конкретную, поэтому не findMany
    where: {id},
    include : {
      owner: {select: {id: true, username: true, firstName: true, lastName: true}},
      members: {
        select: {
          role: true,
          user: {select: {id: true, username: true, firstName: true, lastName: true}},
        },
      },
    },
  });

  if (!card) {
    return null;
  }

  // либо мы владельцы карточки, либо мы участники карточки
  const hasAccess = card.ownerId === session.user.id || card.members.some((member) => member.user.id === session.user.id);

  if (!hasAccess) {
    return null;
  }

  return card;
}

export async function updateMemberRole(cardId: string, targetUserId: string, newRole: "ADMIN" | "MEMBER") {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return {ok: false, message: "Not authenticated"};
  }
  const card = await prisma.card.findUnique({
    where: {id: cardId},
    include: {
      members: {
        select: {
          userId: true,
          role: true
        }
      }
    }
  });
  if (!card) {
    return {ok: false, message: "Card not found"};
  }

  const isOwner = card.ownerId === session.user.id;
  const isAdmin = card.members.some(
    (member) => member.userId === session.user.id && member.role === "ADMIN"
  );
  if (!isOwner && !isAdmin) {
    return {ok: false, message: "Not authorized"};
  }
  if (targetUserId === card.ownerId) {
    return {ok: false, message: "Cannot change the owner`s role"};
  }

  await prisma.cardMember.update({
        where: { cardId_userId: { cardId, userId: targetUserId } },
        data: { role: newRole },
    });

  return {ok: true};
}
