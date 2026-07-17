/*
    Конфгурация NextAuth - какие провайдеры входа допустимы
*/
import type { AuthOptions } from "next-auth"; // тип конфига NextAuth
import GoogleProvider from "next-auth/providers/google"; // готовый OAuth провайдер Google
// в next-auth есть много разных провайдеров (google, github, discord ...)
import CredentialsProvider from "next-auth/providers/credentials";
// провайдер для кастомной авторизации через логин/пароль
import bcrypt from "bcryptjs"; // для хэширования пароля
import { prisma } from "@/lib/prisma"; // для работы с БД через Prisma

export const authConfig: AuthOptions = {
    providers: [
        GoogleProvider({ // конфигурация провайдера Google, cloud.google.com -> Credentials -> OAuth 2.0 Client IDs
            clientId: process.env.GOOGLE_CLIENT_ID!, 
            clientSecret: process.env.GOOGLE_SECRET!
        }),
    // в отличие от GoogleProvider, у CredentialsProider нет готового OAuth флоу - 
    // мы сами описываем как проверять логин/пароль и возвращать объект пользователя
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: {label: "Username", type: "text"},
                password: {label: "Password", type: "password"},
            },
            async authorize(credentials) {
                if (!credentials?.username || !credentials?.password) {
                    return null; // если нет логина или пароля, возвращаем null - авторизация не удалась
                }
                const user = await prisma.user.findUnique({
                    where: {username: credentials.username}
                });
                if (!user) {
                    return null; // если пользователь не найден, возвращаем null - авторизация не удалась
                }
        
                if (!user.password) {
                    return null; // случай если у пользователя нет пароля (зерагался через гугл)
                }
        
                const isValid = await bcrypt.compare(credentials.password, user.password);
                if (!isValid) {
                    return null; // пароли не совпадают
                }
                return {id: user.id, name: user.username, email: user.email};
            }
        })
    ],
    session: {
        strategy: "jwt", // используем JWT вместо сессий в БД
    },
    callbacks: {
        async jwt({token, user}) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({session, token}) {
            if (session.user) {
                session.user.id = token.id as string;
            }
            return session;
        }
    }
}
/*
Auth-цепочка на бэкенде теперь целиком собрана: регистрация → хэш пароля → уникальность; логин → bcrypt.compare → JWT-сессия с user.id.
*/