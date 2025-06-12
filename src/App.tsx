import React, { useRef } from "react";
import cn from "classnames";
import { useWindowSize } from "react-use";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { CompressPage } from "./components/CompressPage";
import { Header } from "./components/Header";
import { FileStatus } from "./constants";
import { Portal } from "react-portal";
import { useFilesToConvert } from "./state";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeProvider } from "@/components/theme-provider";



const HomePage = () => {
  const { width } = useWindowSize();
  const isDesktop = width >= 1090;
  const isTablet = width >= 850;
  const [filesToConvert, setFilesToConvert] = useFilesToConvert();
  useWorkerStatus(); // to trigger re-renders

  return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-colors duration-300">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <h1 className="sr-only">doblar</h1>

          <Portal>
            <div className={cn(
              "fixed z-50 space-y-4 w-full tablet:w-[50%] desktop:w-[300px] px-10 tablet:p-0",
                isTablet ? "right-6 top-6" : "grid grid-cols-1"
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
                      ? "grid grid-cols-2 gap-8 h-[calc(100vh-200px)]"
                      : "space-y-6"
              )}
            >
              {/* File Upload Card */}
              <Card className="border-dashed border-border hover:border-primary/50 transition-colors duration-200 bg-card/50 backdrop-blur-sm">
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
  );
};

const AppContent = () => {
  const workerRef = useRef<WorkerType | undefined>(undefined);
  
  return (
    <WorkerRefContext.Provider value={workerRef}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/compress" element={<CompressPage />} />
        </Routes>
      </Router>
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
