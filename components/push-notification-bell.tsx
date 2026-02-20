"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  subscribePush,
  unsubscribePush,
  getPushSubscriptionStatus,
} from "@/lib/actions/push-notifications";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationBell() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [supported, setSupported] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const hasDbSub = await getPushSubscriptionStatus();
      setSubscribed(hasDbSub);
    } catch {
      // Silently fail — bell will show as unsubscribed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const isSupported =
      VAPID_PUBLIC_KEY !== "" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(isSupported);

    if (isSupported) {
      checkStatus();
    } else {
      setLoading(false);
    }
  }, [checkStatus]);

  async function handleToggle() {
    if (!supported) {
      toast.error("Push notifications are not supported in this browser");
      return;
    }

    setLoading(true);

    try {
      if (subscribed) {
        // Unsubscribe
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
        const result = await unsubscribePush();
        if ("error" in result) {
          toast.error(result.error);
        } else {
          setSubscribed(false);
          toast.success("Push notifications disabled");
        }
      } else {
        // Subscribe
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Notification permission denied");
          setLoading(false);
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });

        const json = subscription.toJSON();
        const formData = new FormData();
        formData.set("endpoint", json.endpoint!);
        formData.set("p256dh", json.keys!.p256dh);
        formData.set("auth", json.keys!.auth);

        const result = await subscribePush(formData);
        if ("error" in result) {
          toast.error(result.error);
        } else {
          setSubscribed(true);
          toast.success("Push notifications enabled");
        }
      }
    } catch (err) {
      console.error("Push toggle error:", err);
      toast.error("Failed to update notification settings");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggle}
          disabled={loading}
          className="size-8"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : subscribed ? (
            <Bell className="size-4" />
          ) : (
            <BellOff className="size-4 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {loading
          ? "Loading..."
          : subscribed
            ? "Disable push notifications"
            : "Enable push notifications"}
      </TooltipContent>
    </Tooltip>
  );
}
