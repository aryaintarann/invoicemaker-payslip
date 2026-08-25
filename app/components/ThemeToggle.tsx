"use client";

import { useTheme } from "next-themes";
import { MoonStars, Sun } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Ganti tema"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="hidden size-4 dark:block" weight="bold" />
      <MoonStars className="size-4 dark:hidden" weight="bold" />
    </Button>
  );
}
