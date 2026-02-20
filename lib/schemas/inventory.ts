import { z } from "zod";

export const consumeInventorySchema = z.object({
  ledger_entry_id: z.string().uuid("Select an inventory item"),
  cause_id: z.string().uuid("Select a drive"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
  notes: z.string().trim().min(1, "Used for / where it went is required"),
});

export const custodyTransferSchema = z.object({
  ledger_entry_id: z.string().uuid("Select an inventory item"),
  from_volunteer_id: z.string().uuid("Select source volunteer"),
  to_volunteer_id: z.string().uuid("Select destination volunteer"),
  quantity: z.coerce.number().positive("Quantity must be positive"),
});

export const adjustInventorySchema = z.object({
  ledger_entry_id: z.string().uuid("Select an inventory item"),
  new_quantity: z.coerce.number().min(0, "Quantity cannot be negative"),
});

export type ConsumeInventoryData = z.infer<typeof consumeInventorySchema>;
export type CustodyTransferData = z.infer<typeof custodyTransferSchema>;
export type AdjustInventoryData = z.infer<typeof adjustInventorySchema>;
