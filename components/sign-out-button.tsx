"use client";

import { signOut } from "next-auth/react";
// по умолчанию сделает автоматический редирект на /, middleware заметит отсутствие
// токена и перекинет на /login

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <>
        <Button onClick = {() => signOut()}>Sign out</Button>
    </>
  );
}