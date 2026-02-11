"use client";

import { useActionState, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createDonor,
  updateDonor,
  deleteDonor,
} from "@/lib/actions/donors";

type Donor = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export function DonorsClient({ donors }: { donors: Donor[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);

  // Add donor
  const [addState, addAction, addPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createDonor(formData);
      if (result?.error) return result;
      toast.success("Donor added successfully");
      setAddOpen(false);
      router.refresh();
      return { success: true };
    },
    null,
  );

  // Edit donor
  const [editState, editAction, editPending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateDonor(formData);
      if (result?.error) return result;
      toast.success("Donor updated successfully");
      setEditOpen(false);
      setEditingDonor(null);
      router.refresh();
      return { success: true };
    },
    null,
  );

  // Reset form state when dialogs close
  useEffect(() => {
    if (!addOpen) return;
  }, [addOpen]);

  useEffect(() => {
    if (!editOpen) {
      setEditingDonor(null);
    }
  }, [editOpen]);

  function handleEdit(donor: Donor) {
    setEditingDonor(donor);
    setEditOpen(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this donor?")) return;
    const result = await deleteDonor(id);
    if (result?.error) {
      toast.error(typeof result.error === "string" ? result.error : "Failed to delete donor");
      return;
    }
    toast.success("Donor deleted successfully");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus />
              Add Donor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Donor</DialogTitle>
              <DialogDescription>
                Add a new donor to the system.
              </DialogDescription>
            </DialogHeader>
            <form action={addAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Name</Label>
                <Input id="add-name" name="name" required />
                {addState && "error" in addState && addState.error?.name && (
                  <p className="text-sm text-destructive">
                    {addState.error.name[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone</Label>
                <Input id="add-phone" name="phone" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email">Email</Label>
                <Input id="add-email" name="email" type="email" />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={addPending}>
                  {addPending ? "Adding..." : "Add Donor"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donors.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground py-8"
                >
                  No donors found. Add your first donor to get started.
                </TableCell>
              </TableRow>
            ) : (
              donors.map((donor) => (
                <TableRow key={donor.id}>
                  <TableCell>
                    <Link
                      href={`/protected/donors/${donor.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {donor.name}
                    </Link>
                  </TableCell>
                  <TableCell>{donor.phone ?? "-"}</TableCell>
                  <TableCell>{donor.email ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleEdit(donor)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDelete(donor.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Donor</DialogTitle>
            <DialogDescription>
              Update the donor&apos;s information.
            </DialogDescription>
          </DialogHeader>
          {editingDonor && (
            <form action={editAction} className="space-y-4">
              <input type="hidden" name="id" value={editingDonor.id} />
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingDonor.name}
                  required
                />
                {editState && "error" in editState && editState.error?.name && (
                  <p className="text-sm text-destructive">
                    {editState.error.name[0]}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  defaultValue={editingDonor.phone ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  defaultValue={editingDonor.email ?? ""}
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={editPending}>
                  {editPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
