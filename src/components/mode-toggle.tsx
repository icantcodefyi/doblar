import React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="outline"
      className={`border-none group  ${
        isDark ? "hover:bg-neutral-800" : "hover:bg-yellow-100"
      }`}
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Moon className="h-[1.2rem] w-[1.2rem] transition-all group-hover:text-neutral-500 duration-200" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] transition-all duration-200 group-hover:text-yellow-500" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
