/*
    Конфгурация NextAuth - какие провайдеры входа допустимы
*/
import type { AuthOptions } from "next-auth"; // тип конфига NextAuth
import GoogleProvider from "next-auth/providers/google"; // готовый OAuth провайдер Google
// в next-auth есть много разных провайдеров (google, github, discord ...)

export const authConfig: AuthOptions = {
    providers: [
        GoogleProvider({ // конфигурация провайдера Google, cloud.google.com -> Credentials -> OAuth 2.0 Client IDs
            clientId: process.env.GOOGLE_CLIENT_ID!, 
            clientSecret: process.env.GOOGLE_SECRET!
        })
    ]
}