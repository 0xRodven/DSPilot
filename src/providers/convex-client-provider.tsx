"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";

let cachedClient: ConvexReactClient | null = null;

function getClient() {
  if (typeof window === "undefined") return null;
  if (!cachedClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) return null;
    cachedClient = new ConvexReactClient(url);
  }
  return cachedClient;
}

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [client, setClient] = useState<ConvexReactClient | null>(null);

  useEffect(() => {
    setClient(getClient());
  }, []);

  if (!client) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <ConvexProviderWithClerk client={client} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  );
}
