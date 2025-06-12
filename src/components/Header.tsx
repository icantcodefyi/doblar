import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Settings } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import logo from "../assets/svg/doblar.svg";

export const Header = () => {
  const location = useLocation();
  const { theme } = useTheme();

  // Determine if we're in dark mode
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 items-center py-4 h-16">
          {/* Navigation - Left Side */}
          <nav className="flex items-center gap-2 justify-start">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "secondary" : "ghost"}
                size="sm"
                className="transition-all duration-200 hover:scale-105"
              >
                Convert
              </Button>
            </Link>
            <Link to="/compress">
              <Button 
                variant={location.pathname === "/compress" ? "secondary" : "ghost"}
                size="sm"
                className="transition-all duration-200 hover:scale-105"
              >
                Compress
              </Button>
            </Link>
          </nav>

          {/* Logo - True Center */}
          <div className="flex justify-center">
            <Link to="/" className="transition-transform duration-200 hover:scale-110">
              <img 
                className="h-8 w-auto transition-all duration-300" 
                src={logo} 
                alt="doblar" 
                style={{
                  filter: isDark ? 'invert(1) brightness(1)' : 'none'
                }}
              />
            </Link>
          </div>

          {/* Mode Toggle - Right Side */}
          <div className="flex items-center justify-end">
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}; 