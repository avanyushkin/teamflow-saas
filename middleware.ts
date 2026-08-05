/*
  Залогиненй пользователь не должен видеть формы логина/регистрации если он
  открывает эти страницы находясь уже в сессии, логичнее редиректить его на /

  Когда позже появится настоящий защищенный контент (дашборд, проекты) - middleware
  должен блокровать доступ неавторизованным и отправлять из на /login

  Почему нельзя росто использовать useSession / getServerSesion:
  Middleware выполняется в Edge runtime, еще до рендера страницы, и не имеет
  доступа к обычному Node-контенту NextAuth. Для чнения JWT-токена прямо из cookie
  на этом уровне есть отдельная низкоуровневая фунция - getToken из next-auth/jwt
*/

import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const token = await getToken({req: request, secret: process.env.NEXTAUTH_SECRET});
  // либо null если пользователь не залогинен, либо объект (JWT из callback.jwt с tkokenid)

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  if (isAuthPage) {
    if (token) {
        return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/register", "/cards/[id]", "/profile"],
    /*
      без matcher middleware выполняется вообще на каждый запрос - включая статику,
      _next/*, картинки и тд, то лишняя работа и потенциальные баги (наприер случайно звернуть
      запрос к самому /api/auth/*, что сломает вход в принципе). Нужно яно ограничить, на каких
      путях от вообще запускается, через экспорт config
    */
}