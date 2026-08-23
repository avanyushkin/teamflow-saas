/*
  при нажатии на New Card всплывание модального окна с формой создания
  карточки, которое реализовано в этом компоненте
*/
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchemaCard } from "../schemas";
import { createCard, getUsers } from "../actions";

import { Dialog, DialogTrigger, DialogContent,
         DialogHeader, DialogTitle
 } from "@/components/ui/dialog";

 import { Textarea } from "@/components/ui/textarea";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import z from "zod";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

type usersType = {
  id: string,
  username: string,
  firstName: string,
  lastName: string
};

 export default function CardDialog({onCreated}: {onCreated?: () => void}) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const [users, setUsers] = useState<usersType[]>([]);

    useEffect(() => {
      if (open) {
        getUsers().then(setUsers);
      }
    }, [open]);

    const form = useForm<z.infer<typeof formSchemaCard>>({
      resolver: zodResolver(formSchemaCard),
      defaultValues: {title: "", description: "", memberIds: [], },
    });
    const selectedIds = form.watch("memberIds");

    async function onSubmit(values: z.infer<typeof formSchemaCard>) {
      const result = await createCard(values);
      if (result.ok) {
        setOpen(false);
        form.reset();
        router.refresh();
        onCreated?.();
      } else {
        form.setError("root", { message: result.message });
      }
    }

    function toggleMember(userId: string) {
      const current = form.getValues("memberIds");
      if (current.includes(userId)) {
        form.setValue("memberIds", current.filter((id) => id !== userId));
      } else {
        form.setValue("memberIds", [...current, userId]);
      }
    }

    return (
    <>
      <Dialog open = {open} onOpenChange = {setOpen}>
        <DialogTrigger render = {<Button />}>
          Create New Card
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

            <Label>Members</Label>
            <div className = "flex flex-col gap-2">
              {users.map((user) => (
                <div key = {user.id} className = "flex items-center gap-2">
                  <Checkbox checked = {selectedIds.includes(user.id)}
                    onCheckedChange = {() => toggleMember(user.id)}
                  />
                  <span>{user.username}</span>
                </div>
              ))}
            </div>

            <Button type = "submit">Create</Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
 }
