import { z } from "zod";

export const templateItemSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("variable"),
    category_id: z.string().uuid("Select a category"),
    description: z.string().min(1, "Description is required"),
    people_per_unit: z.coerce.number().positive("Must be positive"),
    price_per_unit: z.coerce.number().min(0, "Price cannot be negative"),
    currency_id: z.string().uuid("Select a currency"),
  }),
  z.object({
    type: z.literal("fixed"),
    category_id: z.string().uuid("Select a category"),
    description: z.string().min(1, "Description is required"),
    price_per_unit: z.coerce.number().min(0, "Price cannot be negative"),
    currency_id: z.string().uuid("Select a currency"),
  }),
]);

export const templateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required").max(100),
  items: z.array(templateItemSchema).min(1, "Add at least one item"),
});

export type TemplateItem = z.infer<typeof templateItemSchema>;
export type TemplateFormData = z.infer<typeof templateSchema>;
