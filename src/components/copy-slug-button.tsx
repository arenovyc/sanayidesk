"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopySlugButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(slug);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy}>
      {copied ? "Kopyalandı" : "Kopyala"}
    </Button>
  );
}
