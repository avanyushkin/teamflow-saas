import { z } from "zod";

export const formSchemaCard = z.object({
  title: z.string().min(2, "Title must be at least 2 characters").max(30, "Title must be at most 30 characters"),
  description: z.string().max(300, "Description must be at most 300 characters").optional(),
  memberIds: z.array(z.string()).default([]), // массив возможных юзеров карточки
});
