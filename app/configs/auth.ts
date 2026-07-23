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
import GithubProvider from "next-auth/providers/github";

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
        }),
        GithubProvider({
            clientId: process.env.GITHUB_ID!,
            clientSecret: process.env.GITHUB_SECRET!,
        }),
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
        },

        async signIn({user, account, profile}) {
            if (account?.provider === "credentials") {
                return true;
            }

            const email = profile?.email;
            if (!email) {
                return false;
            } // провалидировали email

            const existingUser = await prisma.user.findUnique({where: {email: email}});
            if (existingUser) {
                user.id = existingUser.id;
                return true;
            }

            let new_username = email.split("@")[0]; // берем уже провалидированный email
            while (await prisma.user.findUnique({where: {username: new_username}})) {
                new_username = new_username + "a";
            }

            // profile.name может быть указано как Иван Иванов, а в нашей схеме есть обязательные
            // поля FirstName, LastName - поэтому разобьем profile.name по пробелу
            const fullName = profile?.name?.trim() || new_username;
            const [firstName, ...rest] = fullName.split(" ");
            const lastName = rest.join(" ") || "-";
            
            // создадим пользователя в БД
            const createdUser = await prisma.user.create({
                data: {
                    firstName,
                    lastName,
                    username: new_username,
                    email,
                },
            }); // пароль по умолчанию null

            user.id = createdUser.id; // присваиваем новый id, чтобы jwt callback получил
            // id из нашей БД а не тот, который прислал google/github
            return true;
        }
    }
}
/*
Auth-цепочка на бэкенде теперь целиком собрана: регистрация → хэш пароля → уникальность; логин → bcrypt.compare → JWT-сессия с user.id.
*/