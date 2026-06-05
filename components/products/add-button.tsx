"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AddProductButton() {
  return (
    <Button
      onClick={() => document.getElementById("add-product-trigger")?.click()}
    >
      <Plus className="size-4" /> Add product
    </Button>
  );
}
