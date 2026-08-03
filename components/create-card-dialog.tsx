/*
  при нажатии на New Card всплывание модального окна с формой создания
  карточки, которое реализовано в этом компоненте
*/
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchemaCard } from "@/app/(cards)/zod-schemas/card";
import { createCard } from "@/app/(cards)/actions";

import { Dialog, DialogTrigger, DialogContent, 
         DialogHeader, DialogTitle
 } from "@/components/ui/dialog";

 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { useState } from "react";
import z from "zod";
import { useRouter } from "next/navigation";


 export default function CardDialog() {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const form = useForm<z.infer<typeof formSchemaCard>>({
      resolver: zodResolver(formSchemaCard),
      defaultValues: {title: "", description: "" },
    });

    async function onSubmit(values: z.infer<typeof formSchemaCard>) {
      const result = await createCard(values);
      if (result.ok) {
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        form.setError("root", { message: result.message });
      }
    }

    return (
    <>
      <Dialog open = {open} onOpenChange = {setOpen}>
        <DialogTrigger render = {<Button />}>
          <Button>Create New Card</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Card</DialogTitle>
          </DialogHeader>
          <form onSubmit = {form.handleSubmit(onSubmit)} className = "flex flex-col gap-4">
            {form.formState.errors.root && (
              <p className = "text-sm text-red-500">{form.formState.errors.root?.message}</p>
            )}
            <Label htmlFor = "title">Title</Label>
            <Input id = "title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className = "text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}

            <Label htmlFor = "description">Description</Label>
            <Textarea id = "description" {...form.register("description")} />
            {form.formState.errors.description && (
              <p className = "text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}

            <Button type = "submit">Create</Button>
          </form>           
        </DialogContent>
      </Dialog>
    </>
  );
 }