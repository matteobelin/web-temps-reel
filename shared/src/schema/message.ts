import { z } from "zod";

export const ChatMessageInput = z.object({
    content: z.string().trim().min(1).max(1000),
});

export const ChatMessageOutput = z.object({
    id: z.number().int().positive(),
    content: z.string(),
    createdAt: z.coerce.date(),
    authorName: z.string(),
    authorMatricule: z.string(),
});

export type ChatMessageInputType = z.infer<typeof ChatMessageInput>;
export type ChatMessageOutputType = z.infer<typeof ChatMessageOutput>;