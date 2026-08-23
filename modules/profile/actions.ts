import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth";

export async function getProfileData() { // получение данных пользователя для страницы /profile
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {id: session.user.id},
    select: {firstName: true, lastName: true, username: true, email: true},
  });

  if (!user) {
    return null;
  }

  const [closedCount, openCount, adminCount] = await Promise.all([
    prisma.card.count({
      where: {
        status: "CLOSED",
        OR: [
          { ownerId: session.user.id },
          { members: {some: {userId: session.user.id}}},
        ],
      },
    }),
    prisma.card.count({
      where: {
        status: "OPEN",
        OR: [
          { ownerId: session.user.id },
          { members: {some: {userId: session.user.id}}},
        ],
      },
    }),
    prisma.cardMember.count({ // ищем все карточки, где у текущего юзера роль ADMIN
      where: {userId: session.user.id, role: "ADMIN"},
    }),
  ]);

  return {...user, closedCount, openCount, adminCount};
}
