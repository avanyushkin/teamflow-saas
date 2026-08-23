/*
    серверная граница между формой регистрации/логина и базой данных в Neon/
    Она нужна как отдельный файл потому, что в Next.js 13+ нельзя напрямую
    импортировать серверные функции (bcrypt, PrismaClient) в клиентские компоненты
    и они требуют серверного окружения (Node)
*/
"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import z from "zod";
import { formSchemaRegister } from "./schemas";

type RegisterResult = | {ok: true} | {ok: false, field?: "username"
    | "email" | "root"; message: string };


type RegisterFormDataResult = z.infer<typeof formSchemaRegister>;

export async function registerUser(values: RegisterFormDataResult): Promise<RegisterResult> {

/*
  Это серерный аналог того, что в классическом REST-подходе было бы
  POST /api/register - только реализованных через механизм Server Actions
  место отдельного route handler, и вызываемый прямо как асинхронная функция
  из onSubmit формы

  Фукции:
  - точка входа сервера в БД (откуда values из форму регистрации
    попадают в Neon через Prisma)
  - ревалидация данных (заново прогнать через zod-схему на сервере, не доверяя тому
    что форму уже провалидировала на клиенте (тк клиентский JS можно обойти))
  - провера ункальности username/email до того, как попытаться создать запись,
    чтобы вернуть онятную ошибку
  - создать запись User через prisma.user.create
  - вернуть результат клиенту - успех или структурровнную ошибку
*/
  const parsed = formSchemaRegister.safeParse(values);
  if (!parsed.success) {
    return {ok: false, field: "root", message: "..."};
    // пока как заглушка, потому можно в мессадж дописать parsed.error.issues[0].message
  }

  const existingUser = await prisma.user.findFirst({
    // ищем запись, где совпадает username или email или из введенных данных
    // findFirst вернет либо null если свободно и можно продолжать,
    // либо объект User, если уже есть запись с таким username/email
    where: {
      OR: [
        { username: parsed.data.username },
        { email: parsed.data.email },
      ],
    },
  });

  if (existingUser) { // конкретизируем где именно падает ошибка, чтобы вернуть понятный message клиенту
    if (existingUser.username === parsed.data.username) {
      return {ok: false, field: "username", message: "Username is already taken"};
    }
    if (existingUser.email === parsed.data.email) {
      return {ok: false, field: "email", message: "Email is already registered"};
    }
  }

  const hashedPassword = await bcrypt.hash(parsed.data.password, 10); // хешируем пароль

  await prisma.user.create({ // записываем пользователя в БД
    data: {
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      username: parsed.data.username,
      email: parsed.data.email,
      password: hashedPassword,
    },
  });
  return {ok: true};
}
