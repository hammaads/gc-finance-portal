"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { unvoidDonation } from "@/lib/actions/donations";
import { toast } from "sonner";
import { useState } from "react";

export function DonationDetailActions({
  donationId,
  isVoided,
}: {
  donationId: string;
  isVoided: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (!isVoided) return null;

  async function handleRestore() {
    setPending(true);
    const result = await unvoidDonation(donationId);
    setPending(false);
    if (!result?.error) {
      toast.success("Donation restored");
      router.refresh();
    } else {
      toast.error("Failed to restore");
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleRestore} disabled={pending}>
      {pending ? "Restoring..." : "Restore donation"}
    </Button>
  );
}
