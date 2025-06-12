import React, { useState } from "react";
import { useFilesToConvertAtoms, useFilesToConvert } from "$/state";
import { MobileBox } from "$/components/MobileBox";
import { FileName, Select, ActionButtons, StatusTag } from "./Shared";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { FileText, Archive, Download } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import JSZip from "jszip";

export const Mobile = () => {
  const [filesToConvertAtoms, removeFileToConvertAtom] = useFilesToConvertAtoms();
  const [filesToConvert] = useFilesToConvert();
  const [isCreatingZip, setIsCreatingZip] = useState(false);

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

  const successfulConversions = filesToConvert.filter(file => file.status === "success").length;

  return (
    <div className="bg-card/80 backdrop-blur-sm h-full max-h-[450px] rounded-lg border flex flex-col overflow-hidden">
      <MobileBox title="Files" panelPadding={false}>
        <div className="flex flex-col h-full max-h-[350px] overflow-hidden">
          {/* Download Actions - Only show if there are successful conversions */}
          {successfulConversions > 0 && (
            <div className="flex gap-2 p-3 border-b bg-muted/10 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAsZip}
                disabled={isCreatingZip}
                className="flex-1 text-xs"
              >
                <Archive size={14} className="mr-1" />
                {isCreatingZip ? "Creating ZIP..." : `ZIP (${successfulConversions})`}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadAll}
                className="flex-1 text-xs"
              >
                <Download size={14} className="mr-1" />
                Download All
              </Button>
            </div>
          )}

          {filesToConvertAtoms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-5">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <FileText size={20} className="text-muted-foreground" />
              </div>
              <p className="text-foreground">No files yet</p>
              <p className="text-muted-foreground text-sm mt-1">Upload files to get started</p>
            </div>
          ) : (
            <ScrollArea className={`${successfulConversions > 0 ? 'h-[250px]' : 'h-[300px]'}`}>
              <div className="flex flex-col-reverse space-y-reverse space-y-3 p-4">
                {filesToConvertAtoms.map((fileAtom, index) => {
                  return (
                    <div key={fileAtom.toString()}>
                      <div className="grid grid-cols-2 gap-4 p-3 hover:bg-accent rounded-lg transition-colors duration-150">
                        <div className="space-y-3">
                          <FileName fileAtom={fileAtom} />
                          <Select fileAtom={fileAtom} />
                        </div>

                        <div className="flex flex-col items-end justify-between space-y-3">
                          <StatusTag fileAtom={fileAtom} />
                          <ActionButtons
                            fileAtom={fileAtom}
                            removeFileToConvertAtom={removeFileToConvertAtom}
                          />
                        </div>
                      </div>
                      {index < filesToConvertAtoms.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </MobileBox>
    </div>
  );
};
