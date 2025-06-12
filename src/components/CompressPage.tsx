import React, { useState, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Download,
  Image,
  Settings,
  Trash2,
  Eye,
  Info,
  Zap,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Archive,
} from "lucide-react";
import { Header } from "./Header";
import { useWorkerRefContext, Loader } from "../imagemagick-worker";
import { base64ToBytes } from "byte-base64";
import { ImageFileTypes } from "../constants";
import { Portal } from "react-portal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { downloadAsZip } from "../utils/downloadZip";

interface CompressedFile {
  id: string;
  originalFile: File;
  compressedBlob?: Blob;
  originalSize: number;
  compressedSize?: number;
  compressionRatio?: number;
  status: "pending" | "compressing" | "completed" | "error";
  progress: number;
  preview?: string;
}

export const CompressPage: React.FC = () => {
  const [files, setFiles] = useState<CompressedFile[]>([]);
  const [quality, setQuality] = useState([80]);
  const [enableCustomFormat, setEnableCustomFormat] = useState(false);
  const [outputFormat, setOutputFormat] = useState<ImageFileTypes>("WEBP");
  const [enableResize, setEnableResize] = useState(false);
  const [maxWidth, setMaxWidth] = useState([1920]);
  const [maxHeight, setMaxHeight] = useState([1080]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isCreatingZip, setIsCreatingZip] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useWorkerRefContext();

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error("Failed to create preview"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles) return;

      const imageFiles = Array.from(selectedFiles).filter((file) =>
        file.type.startsWith("image/")
      );

      const newFiles: CompressedFile[] = await Promise.all(
        imageFiles.map(async (file) => {
          try {
            const preview = await createImagePreview(file);
            return {
              id: Math.random().toString(36).substring(2, 11),
              originalFile: file,
              originalSize: file.size,
              status: "pending" as const,
              progress: 0,
              preview,
            };
          } catch {
            return {
              id: Math.random().toString(36).substring(2, 11),
              originalFile: file,
              originalSize: file.size,
              status: "pending" as const,
              progress: 0,
            };
          }
        })
      );

      setFiles((prev) => [...prev, ...newFiles]);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only set dragging to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const getOriginalFormat = (file: File): ImageFileTypes => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "jpg":
      case "jpeg":
        return "JPG";
      case "png":
        return "PNG";
      case "webp":
        return "WEBP";
      case "gif":
        return "GIF";
      case "heic":
        return "HEIC";
      default:
        return "JPG";
    }
  };

  const compressImage = async (
    file: File,
    quality: number,
    format: ImageFileTypes,
    shouldResize: boolean,
    maxW?: number,
    maxH?: number
  ): Promise<Blob> => {
    if (!workerRef?.current) {
      throw new Error("ImageMagick worker not initialized");
    }

    try {
      const content = new Uint8Array(await file.arrayBuffer());

      const compressedData = await workerRef.current.compressFile({
        content,
        format,
        quality,
        ...(shouldResize && { maxWidth: maxW, maxHeight: maxH }),
      });

      // Convert base64 back to Uint8Array
      const uint8Array = base64ToBytes(compressedData);

      // Create blob with appropriate MIME type
      const mimeType =
        format === "JPG"
          ? "image/jpeg"
          : format === "PNG"
          ? "image/png"
          : format === "WEBP"
          ? "image/webp"
          : format === "GIF"
          ? "image/gif"
          : "image/heic";

      return new Blob([uint8Array], { type: mimeType });
    } catch (error) {
      console.error("ImageMagick compression error:", error);
      throw new Error("Failed to compress image with ImageMagick");
    }
  };

  const compressFiles = async () => {
    setIsCompressing(true);

    const pendingFiles = files.filter((f) => f.status === "pending");

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "compressing", progress: 0 } : f
        )
      );

      try {
        // Show initial progress
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: 20 } : f))
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        const format = enableCustomFormat
          ? outputFormat
          : getOriginalFormat(file.originalFile);
        const compressedBlob = await compressImage(
          file.originalFile,
          quality[0],
          format,
          enableResize,
          maxWidth[0],
          maxHeight[0]
        );

        const compressionRatio =
          ((file.originalSize - compressedBlob.size) / file.originalSize) * 100;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  compressedBlob,
                  compressedSize: compressedBlob.size,
                  compressionRatio,
                  status: "completed",
                  progress: 100,
                }
              : f
          )
        );
      } catch (error) {
        console.error("Compression error:", error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, status: "error", progress: 0 } : f
          )
        );
      }

      // Small delay between files for better UX
      if (i < pendingFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setIsCompressing(false);
  };

  const downloadFile = (file: CompressedFile) => {
    if (!file.compressedBlob) return;

    const url = URL.createObjectURL(file.compressedBlob);
    const a = document.createElement("a");
    a.href = url;
    const format = enableCustomFormat
      ? outputFormat
      : getOriginalFormat(file.originalFile);
    const extension = format === "JPG" ? "jpg" : format.toLowerCase();
    a.download = `compressed_${
      file.originalFile.name.split(".")[0]
    }.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllAsZip = async () => {
    setIsCreatingZip(true);

    try {
      const completedFiles = files.filter((f) => f.compressedBlob);

      if (completedFiles.length === 0) {
        return;
      }

      const downloadableFiles = completedFiles.map((file) => {
        const format = enableCustomFormat
          ? outputFormat
          : getOriginalFormat(file.originalFile);
        const extension = format === "JPG" ? "jpg" : format.toLowerCase();
        const filename = `compressed_${
          file.originalFile.name.split(".")[0]
        }.${extension}`;

        return {
          data: file.compressedBlob!,
          filename,
        };
      });

      await downloadAsZip(
        downloadableFiles,
        `compressed-images-${new Date().toISOString().split("T")[0]}.zip`
      );
    } catch (error) {
      console.error("Failed to create zip file:", error);
    } finally {
      setIsCreatingZip(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllFiles = () => {
    setFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const totalOriginalSize = files.reduce(
    (sum, file) => sum + file.originalSize,
    0
  );
  const totalCompressedSize = files.reduce(
    (sum, file) => sum + (file.compressedSize || 0),
    0
  );

  const getQualityDescription = (quality: number) => {
    if (quality >= 90) return "Maximum quality - Minimal compression";
    if (quality >= 80) return "High quality - Recommended for photos";
    if (quality >= 70) return "Good quality - Balanced size/quality";
    if (quality >= 50) return "Medium quality - Smaller file size";
    return "Low quality - Maximum compression";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-colors duration-300">
      <Portal>
        <div className="fixed z-50 top-6 right-6 w-[300px]">
          <Loader />
        </div>
      </Portal>

      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm h-[calc(100vh-120px)]">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Compression Settings
                </CardTitle>
                <CardDescription>
                  Adjust the compression parameters
                </CardDescription>
              </CardHeader>
              <ScrollArea className="h-[calc(100vh-250px)]">
                <CardContent className="space-y-6 pb-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">
                      Quality: {quality[0]}%
                    </Label>
                    <Slider
                      value={quality}
                      onValueChange={setQuality}
                      max={100}
                      min={10}
                      step={5}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      {getQualityDescription(quality[0])}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Custom Output Format
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEnableCustomFormat(!enableCustomFormat)
                        }
                        className="flex items-center gap-2"
                      >
                        {enableCustomFormat ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                        {enableCustomFormat ? "On" : "Off"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When disabled, images will keep their original format (JPG
                      → JPG, PNG → PNG, etc.)
                    </p>
                  </div>

                  {enableCustomFormat && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">
                        Output Format
                      </Label>
                      <Select
                        value={outputFormat}
                        onValueChange={(value) =>
                          setOutputFormat(value as ImageFileTypes)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WEBP">
                            <div className="flex items-center justify-between w-full">
                              <span>WebP</span>
                              <Badge
                                variant="secondary"
                                className="ml-2 text-xs"
                              >
                                Recommended
                              </Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="JPG">JPEG</SelectItem>
                          <SelectItem value="PNG">PNG</SelectItem>
                          <SelectItem value="GIF">GIF</SelectItem>
                          <SelectItem value="HEIC">HEIC</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        WebP provides the best compression with quality
                        retention
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Resize Images
                      </Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEnableResize(!enableResize)}
                        className="flex items-center gap-2"
                      >
                        {enableResize ? (
                          <ToggleRight className="h-4 w-4 text-primary" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                        {enableResize ? "On" : "Off"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      When disabled, images will be compressed at their original
                      dimensions
                    </p>
                  </div>

                  {enableResize && (
                    <>
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Max Width: {maxWidth[0]}px
                        </Label>
                        <Slider
                          value={maxWidth}
                          onValueChange={setMaxWidth}
                          max={4000}
                          min={320}
                          step={50}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">
                          Max Height: {maxHeight[0]}px
                        </Label>
                        <Slider
                          value={maxHeight}
                          onValueChange={setMaxHeight}
                          max={3000}
                          min={240}
                          step={50}
                          className="w-full"
                        />
                      </div>

                      <div className="p-3 bg-muted/30 rounded-lg border">
                        <p className="text-xs text-muted-foreground">
                          <Info className="h-3 w-3 inline mr-1" />
                          Images larger than these dimensions will be resized
                          while maintaining aspect ratio
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Combined Drop Zone and File List */}
            <Card
              className={`bg-card/70 backdrop-blur-sm border shadow-lg h-[calc(100vh-120px)] flex flex-col transition-all duration-200 ${
                isDragging
                  ? "border-primary border-2 bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/30"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <CardHeader className="pb-4 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    {files.length === 0
                      ? "Drop Images or Click to Add"
                      : `Files (${files.length})`}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Add Images
                    </Button>
                    <Button
                      onClick={compressFiles}
                      variant="default"
                      disabled={
                        isCompressing ||
                        files.length === 0 ||
                        files.every((f) => f.status !== "pending")
                      }
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      {isCompressing ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Compressing {files.length} images...
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 shrink-0" />
                          Compress{" "}
                          {
                            files.filter((f) => f.status === "pending").length
                          }{" "}
                          Images
                        </>
                      )}
                    </Button>
                    {files.length > 0 && (
                      <>
                        <Separator
                          orientation="vertical"
                          className="h-6 self-center"
                        />
                        {files.some((f) => f.compressedBlob) && (
                          <Button
                            onClick={downloadAllAsZip}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download All
                          </Button>
                        )}
                        <Button
                          onClick={clearAllFiles}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                          Clear All
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-6">
                {files.length === 0 ? (
                  <div
                    className={`h-full flex items-center justify-center text-center cursor-pointer transition-all duration-200 rounded-lg border-2 border-dashed ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/20"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-muted-foreground py-12">
                      <Upload
                        className={`h-16 w-16 mx-auto mb-6 transition-colors ${
                          isDragging ? "text-primary" : ""
                        }`}
                      />
                      <h3 className="text-xl font-semibold mb-3">
                        {isDragging
                          ? "Drop your images here!"
                          : "Drop images here or click to select"}
                      </h3>
                      <p className="text-sm mb-4">
                        Supports JPEG, PNG, WebP, GIF, HEIC and other image
                        formats
                      </p>
                      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground/70">
                        <span>• Drag & Drop</span>
                        <span>• Multiple files</span>
                        <span>• Batch compression</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full relative">
                    <ScrollArea className="h-full">
                      <div className="space-y-4 pr-4">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {file.preview ? (
                                  <img
                                    src={file.preview}
                                    alt={file.originalFile.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Image className="h-6 w-6 text-primary" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate">
                                    {file.originalFile.name}
                                  </p>
                                  {file.status === "completed" && (
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  )}
                                  {file.status === "error" && (
                                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                  <span>
                                    {formatFileSize(file.originalSize)}
                                  </span>
                                  {file.compressedSize && (
                                    <>
                                      <span>→</span>
                                      <span className="text-primary font-medium">
                                        {formatFileSize(file.compressedSize)}
                                      </span>
                                      {file.compressionRatio && (
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          -{file.compressionRatio.toFixed(1)}%
                                        </Badge>
                                      )}
                                    </>
                                  )}
                                </div>

                                {file.status === "compressing" && (
                                  <div className="mt-2">
                                    <Progress
                                      value={file.progress}
                                      className="h-2"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Compressing... {file.progress}%
                                    </p>
                                  </div>
                                )}

                                {file.status === "error" && (
                                  <p className="text-xs text-destructive mt-1">
                                    Failed to compress this image
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 ml-4">
                              {file.status === "completed" &&
                                file.compressedBlob && (
                                  <Button
                                    onClick={() => downloadFile(file)}
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                )}

                              <Button
                                onClick={() => removeFile(file.id)}
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    {/* Drop overlay when dragging over files */}
                    {isDragging && files.length > 0 && (
                      <div className="absolute inset-0 bg-primary/10 border-2 border-primary border-dashed rounded-lg flex items-center justify-center pointer-events-none">
                        <div className="text-center text-primary">
                          <Upload className="h-12 w-12 mx-auto mb-2" />
                          <p className="font-semibold">
                            Drop to add more images
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
