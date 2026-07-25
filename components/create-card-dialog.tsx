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


 export default function CardDialog() {
    const [open, setOpen] = useState(false);
    return (
    <>
    </>
  );
 }