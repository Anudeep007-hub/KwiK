import {z} from "zod"; 

export const linkSchema = z.object({
    longUrl: z.url("Please enter a valid URL"),
}); 

export type LinkFormData = z.infer<typeof linkSchema>;