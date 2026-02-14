"use client";

import { useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  createCause,
  updateCause,
  deleteCause,
} from "@/lib/actions/causes";

// ── Types ──

type Cause = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  date: string | null;
  location: string | null;
  expected_headcount: number | null;
};

type DriveSummary = {
  cause_id: string | null;
  cause_name: string | null;
  type: string | null;
  date: string | null;
  location: string | null;
  expected_headcount: number | null;
  total_budget_pkr: number | null;
  total_spent_pkr: number | null;
  remaining_budget_pkr: number | null;
  total_donations_pkr: number | null;
};

interface DrivesClientProps {
  causes: Cause[];
  summaries: DriveSummary[];
}

// ── Add Cause Dialog ──

function AddCauseDialog({ type }: { type: "drive" | "other" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await createCause(formData);
      if ("success" in result && result.success) {
        toast.success(type === "drive" ? "Drive created" : "Cause created");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(
          type === "drive"
            ? "Failed to create drive"
            : "Failed to create cause",
        );
      }
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-1 size-4" />
          {type === "drive" ? "Add Drive" : "Add Cause"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === "drive" ? "Add Drive" : "Add Cause"}
          </DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="type" value={type} />
          <div className="space-y-2">
            <Label htmlFor={`add-${type}-name`}>Name</Label>
            <Input
              id={`add-${type}-name`}
              name="name"
              placeholder={
                type === "drive" ? "e.g. Iftaar Drive 2025" : "e.g. Orphan Fund"
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`add-${type}-description`}>Description</Label>
            <Input
              id={`add-${type}-description`}
              name="description"
              placeholder="Optional description"
            />
          </div>
          {type === "drive" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="add-drive-date">Date</Label>
                  <Input
                    id="add-drive-date"
                    name="date"
                    type="date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="add-drive-headcount">
                    Expected Headcount
                  </Label>
                  <Input
                    id="add-drive-headcount"
                    name="expected_headcount"
                    type="number"
                    min={1}
                    placeholder="e.g. 500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-drive-location">Location</Label>
                <Input
                  id="add-drive-location"
                  name="location"
                  placeholder="e.g. Karachi"
                />
              </div>
            </>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Cause Dialog ──

function EditCauseDialog({ cause }: { cause: Cause }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const isDrive = cause.type === "drive";

  const [, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      const result = await updateCause(formData);
      if ("success" in result && result.success) {
        toast.success(isDrive ? "Drive updated" : "Cause updated");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(isDrive ? "Failed to update drive" : "Failed to update cause");
      }
      return result;
    },
    null,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isDrive ? "Edit Drive" : "Edit Cause"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="id" value={cause.id} />
          <input type="hidden" name="type" value={cause.type} />
          <div className="space-y-2">
            <Label htmlFor={`edit-cause-name-${cause.id}`}>Name</Label>
            <Input
              id={`edit-cause-name-${cause.id}`}
              name="name"
              defaultValue={cause.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-cause-description-${cause.id}`}>
              Description
            </Label>
            <Input
              id={`edit-cause-description-${cause.id}`}
              name="description"
              defaultValue={cause.description ?? ""}
            />
          </div>
          {isDrive && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`edit-cause-date-${cause.id}`}>Date</Label>
                  <Input
                    id={`edit-cause-date-${cause.id}`}
                    name="date"
                    type="date"
                    defaultValue={cause.date ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-cause-headcount-${cause.id}`}>
                    Expected Headcount
                  </Label>
                  <Input
                    id={`edit-cause-headcount-${cause.id}`}
                    name="expected_headcount"
                    type="number"
                    min={1}
                    defaultValue={cause.expected_headcount ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`edit-cause-location-${cause.id}`}>
                  Location
                </Label>
                <Input
                  id={`edit-cause-location-${cause.id}`}
                  name="location"
                  defaultValue={cause.location ?? ""}
                />
              </div>
            </>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Cause Dialog ──

function DeleteCauseDialog({ cause }: { cause: Cause }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteCause(cause.id);
    if ("success" in result && result.success) {
      toast.success(
        cause.type === "drive" ? "Drive deleted" : "Cause deleted",
      );
      setOpen(false);
      router.refresh();
    } else {
      toast.error(
        cause.type === "drive"
          ? "Failed to delete drive"
          : "Failed to delete cause",
      );
    }
    setDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Delete {cause.type === "drive" ? "Drive" : "Cause"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-foreground">{cause.name}</span>?
          This action cannot be undone.
        </p>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Drive Card ──

function DriveCard({
  cause,
  summary,
}: {
  cause: Cause;
  summary: DriveSummary | undefined;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>
              <Link
                href={`/protected/drives/${cause.id}`}
                className="hover:underline"
              >
                {cause.name}
              </Link>
            </CardTitle>
            {cause.description && (
              <CardDescription>{cause.description}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-1">
            <EditCauseDialog cause={cause} />
            <DeleteCauseDialog cause={cause} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {cause.date && (
            <span className="flex items-center gap-1">
              <Calendar className="size-4" />
              {formatDate(cause.date)}
            </span>
          )}
          {cause.location && (
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {cause.location}
            </span>
          )}
          {cause.expected_headcount && (
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {cause.expected_headcount.toLocaleString()} expected
            </span>
          )}
        </div>
        {summary && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Budget</p>
              <p className="text-sm font-semibold">
                {formatCurrency(summary.total_budget_pkr ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Spent</p>
              <p className="text-sm font-semibold">
                {formatCurrency(summary.total_spent_pkr ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-semibold">
                {formatCurrency(summary.remaining_budget_pkr ?? 0)}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Drives Client ──

export function DrivesClient({ causes, summaries }: DrivesClientProps) {
  const drives = causes.filter((c) => c.type === "drive");
  const otherCauses = causes.filter((c) => c.type !== "drive");

  const summaryMap = new Map(
    summaries
      .filter((s): s is DriveSummary & { cause_id: string } => s.cause_id !== null)
      .map((s) => [s.cause_id, s]),
  );

  return (
    <div className="space-y-8">
      {/* Iftaar Drives */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Iftaar Drives</h2>
          <AddCauseDialog type="drive" />
        </div>
        {drives.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No drives yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => (
              <DriveCard
                key={drive.id}
                cause={drive}
                summary={summaryMap.get(drive.id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Other Causes */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Other Causes</h2>
          <AddCauseDialog type="other" />
        </div>
        {otherCauses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No other causes yet. Add one to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {otherCauses.map((cause) => (
              <div
                key={cause.id}
                className="flex items-center justify-between rounded-lg border px-4 py-3"
              >
                <div className="space-y-0.5">
                  <Link
                    href={`/protected/drives/${cause.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {cause.name}
                  </Link>
                  {cause.description && (
                    <p className="text-xs text-muted-foreground">
                      {cause.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <EditCauseDialog cause={cause} />
                  <DeleteCauseDialog cause={cause} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
