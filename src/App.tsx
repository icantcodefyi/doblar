import React, { useRef } from "react";
import cn from "classnames";
import { useWindowSize } from "react-use";
import { DragDropFile } from "$/components/DragDropFile";
import { uuid4 } from "./utils/uuid";
import {
  Loader,
  WorkerType,
  useWorkerStatus,
  WorkerRefContext,
} from "./imagemagick-worker";
import { ReloadPrompt } from "./components/ReloadPrompt";
import { FileBox } from "./components/FileBox";
import { About } from "./components/About";
import { FileStatus } from "./constants";
import { Portal } from "react-portal";
import { useFilesToConvert } from "./state";
import logo from "./assets/svg/doblar.svg";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";

const AppContent = () => {
  const { width } = useWindowSize();
  const workerRef = useRef<WorkerType | undefined>(undefined);
  const isDesktop = width >= 1090;
  const isTablet = width >= 850;
  const [filesToConvert, setFilesToConvert] = useFilesToConvert();
  const { theme } = useTheme();
  useWorkerStatus(); // to trigger re-renders

  // Determine if we're in dark mode
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <WorkerRefContext.Provider value={workerRef}>
        <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 px-6 py-8 transition-colors duration-300">
          <div className="max-w-7xl mx-auto space-y-8">
            <header className="text-center relative">
          <h1 className="sr-only">doblar</h1>
              
              {/* Theme Toggle */}
              <div className="absolute top-0 right-0">
                <ModeToggle />
              </div>
              
              <div className="flex justify-center mb-8">
                <img 
                  className="w-48 h-auto transition-all duration-300" 
                  src={logo} 
                  alt="doblar" 
                  aria-hidden={true}
                  style={{
                    filter: isDark ? 'invert(1) brightness(1)' : 'none'
                  }}
                />
              </div>
        </header>

        <Portal>
          <div className={cn(
            "fixed z-20 space-y-4 w-full tablet:w-[50%] desktop:w-[30%] px-10 tablet:p-0",
              isTablet ? "right-6 top-6" : "grid grid-cols-1 bottom-6"
          )}>
            <Loader />
            <ReloadPrompt />
          </div>
        </Portal>

          {/* Main Content */}
          <div className="space-y-8">
        <div
          className={cn(
            isDesktop
                  ? "grid grid-cols-2 gap-8 h-[50vh]"
                  : "space-y-6"
          )}
        >
                            {/* File Upload Card */}
              <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors duration-200 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-0 h-full">
                  <DragDropFile
                    text="Drag files here or click to select"
                    className="w-full h-full border-0 bg-transparent hover:bg-accent transition-colors duration-200 rounded-lg"
            handleFiles={(files) => {
              const fileStatuses: FileStatus[] = files.map((file) => ({
                file: file,
                status: "not-started",
                id: uuid4(),
              }));

              setFilesToConvert([...filesToConvert, ...fileStatuses]);
            }}
          />
                </CardContent>
              </Card>

              {/* File Processing Card */}
              <Card className="bg-card/70 backdrop-blur-sm border shadow-lg">
                <CardContent className="p-0 h-full">
          <FileBox />
                </CardContent>
              </Card>
            </div>
        </div>
          
        <About />
          </div>
      </div>
    </WorkerRefContext.Provider>
  );
};

export const App = () => {
  return (
    <ThemeProvider defaultTheme="system" storageKey="doblar-ui-theme">
      <AppContent />
    </ThemeProvider>
  );
};
