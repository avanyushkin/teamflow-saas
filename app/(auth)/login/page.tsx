"use client";
import { formSchemaLogin } from "../zod-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";    
import { Label } from "@/components/ui/label";

export default function Login() {
  const form = useForm<z.infer<typeof formSchemaLogin>>({
    resolver: zodResolver(formSchemaLogin),
    defaultValues: {
        username: "",
        password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchemaLogin>) {
    console.log(values);
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
                    <CardContent>
                        <Label htmlFor = "username">Username</Label>
                        <Input id = "username" type = "text" {...form.register("username")}/>
                        <Label htmlFor = "password">Password</Label>
                        <Input id = "password" type = "password" {...form.register("password")}/>
                    </CardContent>
                    <CardFooter className = "flex-col gap-2">
                        <Button type = "submit" className = "w-full">Login</Button>
                        <Button type="button" variant="outline" className="w-full">Login with Google</Button>
                        <Button type="button" variant="outline" className="w-full">Login with GitHub</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    </>
  );
}