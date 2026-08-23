"use client";
import { formSchemaLogin } from "../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

import { signIn } from "next-auth/react";
/*
  это клиентская обертка, которая отправляет запрос на NextAuth-эндпоинт (app/api/auth/[...nextauth]/route.ts)
  тот вызывает authorize из CredentialsProvider в auth.ts, и в случае успеха выставляет
  JWT-сессию (cookie).

  signIn сама делает редирект на страницу после входа, но тогда у нас не получится красиво
  обработать ошибку прямо в форме (страница просто перезагрузится с query параметром ошибки)

  Поэтому для форм с обственной обработкой ошибок ставим redirect: false
*/

export function LoginForm() {
  const form = useForm<z.infer<typeof formSchemaLogin>>({
    resolver: zodResolver(formSchemaLogin),
    defaultValues: {
        username: "",
        password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchemaLogin>) {
    const result = await signIn("credentials", {
        // возвращает объект (или undefined если что-то совсем пошло не так на уровне сети)
        // с полями ok, error, status.
        username: values.username,
        password: values.password,
        redirect: false,
    });

    if (result?.error) {
        form.setError("root", { message: "Invalid username or password"});
        return;
    }

    router.push("/"); // редирект залогиненого пользователя
  }

  const router = useRouter();
  const handlePageRedirect = () => {
    router.push("/register");
  }

  return (
    <>
        <div className = "flex min-h-screen items-center justify-center bg-background px-4">
            <Card className = "w-full sm:max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Login if you already have an account</CardDescription>
                </CardHeader>
                <form onSubmit = {form.handleSubmit(onSubmit)}>
                    {form.formState.errors.root && ( // ошибка на уровне корня
                        <p className = "text-sm text-red-500">{form.formState.errors.root.message}</p>
                    )}
                    <CardContent>
                        <Label htmlFor = "username">Username</Label>
                        <Input id = "username" type = "text" {...form.register("username")}/>
                        {form.formState.errors.username && ( // ошибка на уровне логина
                            <p className = "text-sm text-red-500">{form.formState.errors.username.message}</p>
                        )}
                        <Label htmlFor = "password">Password</Label>
                        <Input id = "password" type = "password" {...form.register("password")}/>
                        {form.formState.errors.password && ( // ошибка на уровне пароля
                            <p className = "text-sm text-red-500">{form.formState.errors.password.message}</p>
                        )}
                    </CardContent>
                    <CardFooter className = "flex-col gap-2">
                        <div className = "flex gap-4 w-full">
                            <Button type = "submit" className = "flex-1">Login</Button>
                            <Button type = "button" className = "flex-1" onClick = {handlePageRedirect}>Register</Button>
                        </div>
                        <Button type="button" variant="outline" className="w-full"
                            onClick = {() => signIn("google")}
                        >Login with Google</Button>
                        <Button type="button" variant="outline" className="w-full"
                            onClick = {() => signIn("github")}
                        >Login with GitHub</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </>
  );
}
