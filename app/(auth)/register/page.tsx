"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { formSchemaRegister } from "../zod-schemas";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function Register() {
    const form = useForm<z.infer<typeof formSchemaRegister>>({
        resolver: zodResolver(formSchemaRegister), // валидирует данные, но это происходит в браузере
                                                   // в js коде, который пользователь полностью контролирует
                                                   // Он может открыть DevTools, отключить JS-валидацию или напрямую
                                                   // дернуть server action с любыми данными, минуя форму
                                                   // Поэтому на сервере нужно еще раз прогнать данные через туже форму
        defaultValues: {
            firstName: "",
            lastName: "",
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    function onSubmit(values: z.infer<typeof formSchemaRegister>) {
        console.log(values);
    }

    const router = useRouter();

    const handlePageRedirect = () => {
        router.push("/login");
    }

    return (
        <div className = "flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Registration</CardTitle>
                <CardDescription>Register if you do not have an account</CardDescription>
            </CardHeader>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" type="text" {...form.register("firstName")} />
                            {form.formState.errors.firstName && (
                                <p className="text-sm text-red-500">{form.formState.errors.firstName.message}</p>
                            )}

                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" type="text" {...form.register("lastName")} />
                            {form.formState.errors.lastName && (
                                <p className="text-sm text-red-500">{form.formState.errors.lastName.message}</p>
                            )}

                            <Label htmlFor="username">Username</Label>
                            <Input id="username" type="text" {...form.register("username")} />
                            {form.formState.errors.username && (
                                <p className="text-sm text-red-500">{form.formState.errors.username.message}</p>
                            )}

                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="@example.com" {...form.register("email")} />
                            {form.formState.errors.email && (
                                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                            )}

                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" {...form.register("password")} />
                            {form.formState.errors.password && (
                                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
                            )}

                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input id="confirmPassword" type="password" {...form.register("confirmPassword")} />
                            {form.formState.errors.confirmPassword && (
                                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message}</p>
                            )}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2">
                    <div className = "flex w-full gap-4">
                        <Button type="submit" className="flex-1">Register</Button>
                        <Button type="button" className="flex-1" onClick = {handlePageRedirect}>Login</Button>
                    </div>
                    <Button type="button" variant="outline" className="w-full">Login with Google</Button>
                    <Button type="button" variant="outline" className="w-full">Login with GitHub</Button>
                </CardFooter>
            </form>
        </Card>
        </div>
    );
}
