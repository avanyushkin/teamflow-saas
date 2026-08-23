/*
    nextjs app router endpoint для NextAuth (catch-all роут /api/auth/*)
*/
import NextAuth from "next-auth"; // фабрика для создания эндпоинта NextAuth
import { authConfig } from "@/lib/auth"; // конфиг провайдеров

const handler = NextAuth(authConfig); // создает единый хендлер на основе конфига

export {handler as GET, handler as POST};
// App Router требует именованных экспортов методов;
// GET нужен для callback/signin-редиректов
// POST нужен для отправки данных формы на /api/auth/callback/credentials
