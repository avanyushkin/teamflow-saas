import { z } from "zod";

const formSchema = z.object({
    firstName: z.string().min(2, "First Name must be at least 2 characters").max(32, "First name must be at most 32 characters"),
    lastName: z.string().min(2, "Last Name must be at least 2 characters").max(32, "Last name must be at most 32 characters"),
    username: z.string().min(4, "Username must be at least 4 characters").max(32, "Username must be at most 32 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters").max(64, "Password must be at most 64 characters"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export default formSchema;
