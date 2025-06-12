import React, { useState, useMemo } from "react";
import { useFilesToConvertAtoms, useFilesToConvert } from "$/state";
import { FileName, Select, ActionButtons, StatusTag } from "./Shared";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, CheckSquare, Square, Zap, Archive } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { imageFileTypes, type ImageFileTypes } from "$/constants";
import { useAtom } from "jotai";
import { useWorkerRefContext } from "$/imagemagick-worker";
import { convertFile } from "$/utils/convertFile";
import JSZip from "jszip";

export const Desktop = () => {
  const [filesToConvertAtoms, removeFileToConvertAtom] = useFilesToConvertAtoms();
  const [filesToConvert, setFilesToConvert] = useFilesToConvert();
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const ref = useWorkerRefContext();

  const allSelected = selectedFileIds.size === filesToConvertAtoms.length && filesToConvertAtoms.length > 0;
  const someSelected = selectedFileIds.size > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedFileIds(new Set());
    } else {
      const allIds = new Set(filesToConvert.map(file => file.id));
      setSelectedFileIds(allIds);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFileIds);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFileIds(newSelected);
  };

  const bulkConvertTo = async (format: ImageFileTypes) => {
    if (!ref?.current) return;

    // Update all selected files with the target format and set to in-progress
    const updatedFiles = filesToConvert.map(file => {
      if (selectedFileIds.has(file.id) && file.status === "not-started") {
        return { ...file, convertTo: format, status: "in-progress" as const };
      }
      return file;
    });

    setFilesToConvert(updatedFiles);

    // Get files to convert
    const filesToConvertList = updatedFiles.filter(file => 
      selectedFileIds.has(file.id) && file.status === "in-progress"
    );

    // Start conversions for selected files
    const conversionPromises = filesToConvertList.map(async (file) => {
      try {
        const convertedFile = await convertFile(file, ref.current!);
        return convertedFile;
      } catch (error) {
        return { ...file, status: "failed" as const, statusTooltip: "Conversion failed" };
      }
    });

    // Wait for all conversions to complete
    const results = await Promise.allSettled(conversionPromises);
    
    // Update the files with the results
    const finalFiles = filesToConvert.map(file => {
      if (selectedFileIds.has(file.id)) {
        const fileIndex = filesToConvertList.findIndex(f => f.id === file.id);
        if (fileIndex !== -1 && results[fileIndex]?.status === "fulfilled") {
          return results[fileIndex].value;
        }
      }
      return file;
    });

    setFilesToConvert(finalFiles);
    setSelectedFileIds(new Set()); // Clear selection after bulk operation
  };

  const downloadAll = () => {
    filesToConvert.forEach(file => {
      if (file.status === "success" && file.successData?.url) {
        const link = document.createElement('a');
        link.href = file.successData.url;
        link.download = file.file.name
          .replace(/\.[^/.]+$/, "")
          .concat(".", file.convertTo as string);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const downloadAsZip = async () => {
    setIsCreatingZip(true);
    
    try {
      const zip = new JSZip();
      const successfulFiles = filesToConvert.filter(file => file.status === "success");
      
      if (successfulFiles.length === 0) {
        return;
      }

      // Add each file to the zip
      for (const file of successfulFiles) {
        if (file.successData?.data) {
          const fileName = file.file.name
            .replace(/\.[^/.]+$/, "")
            .concat(".", file.convertTo as string);
          zip.file(fileName, file.successData.data);
        }
      }

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Create download link
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `converted-files-${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Failed to create zip file:", error);
    } finally {
      setIsCreatingZip(false);
    }
  };

  const successfulConversions = filesToConvert.filter(file => file.status === "success").length;

  return (
    <div className="h-full flex flex-col bg-card/50 backdrop-blur-sm rounded-lg">
      {/* Bulk Actions Toolbar */}
      {filesToConvertAtoms.length > 0 && (
        <div className="flex items-center justify-between p-4 border-b bg-muted/20">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="h-8 w-8 p-0"
            >
              {allSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedFileIds.size > 0 ? `${selectedFileIds.size} selected` : `${filesToConvertAtoms.length} files`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {successfulConversions > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAsZip}
                  disabled={isCreatingZip}
                  className="h-8 text-xs"
                >
                  <Archive size={14} className="mr-1" />
                  {isCreatingZip ? "Creating ZIP..." : `Download ZIP (${successfulConversions})`}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadAll}
                  className="h-8 text-xs"
                >
                  <Download size={14} className="mr-1" />
                  Download All
                </Button>
              </>
            )}
            
            {someSelected && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" size="sm" className="h-8 text-xs">
                    <Zap size={14} className="mr-1" />
                    Convert Selected
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Convert {selectedFileIds.size} files to:</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {imageFileTypes.map((format) => (
                    <DropdownMenuItem
                      key={format}
                      onClick={() => bulkConvertTo(format)}
                    >
                      {format.toUpperCase()}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {filesToConvertAtoms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <FileText size={24} className="text-muted-foreground" />
            </div>
            <p className="text-foreground text-lg">No files yet</p>
            <p className="text-muted-foreground text-sm mt-1">Upload files to get started</p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="flex flex-col-reverse p-4 space-y-reverse space-y-2">
              {filesToConvertAtoms.map((fileAtom, index) => {
                // Find the corresponding file data from filesToConvert
                const fileData = filesToConvert.find(file => {
                  // We need to match by some property - using index as fallback
                  return filesToConvert.indexOf(file) === index;
                });
                
                const isSelected = fileData ? selectedFileIds.has(fileData.id) : false;
                
                return (
                  <div key={fileAtom.toString()}>
                    <div className={`grid grid-cols-6 gap-4 p-4 hover:bg-accent rounded-lg transition-colors duration-150 ${
                      isSelected ? 'bg-accent border-2 border-primary/20' : ''
                    }`}>
                      <div className="flex col-span-2 items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fileData && toggleFileSelection(fileData.id)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                        </Button>
                        <FileName fileAtom={fileAtom} />
                      </div>
                      <div className="col-span-2 flex items-center">
                        <Select fileAtom={fileAtom} />
                      </div>
                      <div className="flex items-center justify-end">
                        <StatusTag fileAtom={fileAtom} />
                      </div>
                      <div className="flex items-center justify-end">
                        <ActionButtons fileAtom={fileAtom} removeFileToConvertAtom={removeFileToConvertAtom} />
                      </div>
                    </div>
                    {index < filesToConvertAtoms.length - 1 && (
                      <Separator className="my-1" />
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

