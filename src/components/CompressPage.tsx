import React, { useState, useCallback, useRef } from "react";
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
  Menu,
  X,
} from "lucide-react";

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

type ImageFileTypes = "WEBP" | "JPG" | "PNG" | "GIF" | "HEIC";

export default function CompressPage() {
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
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const compressFiles = async () => {
    setIsCompressing(true);
    setShowMobileSettings(false); // Close mobile settings when compressing

    const pendingFiles = files.filter((f) => f.status === "pending");

    for (let i = 0; i < pendingFiles.length; i++) {
      const file = pendingFiles[i];

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "compressing", progress: 0 } : f
        )
      );

      try {
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, progress: 20 } : f))
        );

        await new Promise((resolve) => setTimeout(resolve, 100));

        // Mock compression for demo
        const mockCompressedSize = Math.floor(file.originalSize * 0.3);
        const compressionRatio = ((file.originalSize - mockCompressedSize) / file.originalSize) * 100;

        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? {
                  ...f,
                  compressedSize: mockCompressedSize,
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

      if (i < pendingFiles.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    setIsCompressing(false);
  };

  const downloadFile = (file: CompressedFile) => {
    console.log("Download file:", file.originalFile.name);
  };

  const downloadAllAsZip = async () => {
    setIsCreatingZip(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log("Download all files as ZIP");
    setIsCreatingZip(false);
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

  const getQualityDescription = (quality: number) => {
    if (quality >= 90) return "Maximum quality - Minimal compression";
    if (quality >= 80) return "High quality - Recommended for photos";
    if (quality >= 70) return "Good quality - Balanced size/quality";
    if (quality >= 50) return "Medium quality - Smaller file size";
    return "Low quality - Maximum compression";
  };

  // Settings Panel Component for reuse
  const SettingsPanel = () => (
    <div className="space-y-4 sm:space-y-6">
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
            onClick={() => setEnableCustomFormat(!enableCustomFormat)}
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
          When disabled, images will keep their original format
        </p>
      </div>

      {enableCustomFormat && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Output Format</Label>
          <Select
            value={outputFormat}
            onValueChange={(value) => setOutputFormat(value as ImageFileTypes)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="WEBP">
                <div className="flex items-center justify-between w-full">
                  <span>WebP</span>
                  <Badge variant="secondary" className="ml-2 text-xs">
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
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Resize Images</Label>
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
              Images larger than these dimensions will be resized while maintaining aspect ratio
            </p>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 transition-colors duration-300">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold">Image Compressor</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMobileSettings(!showMobileSettings)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Mobile Settings Dialog */}
      <Dialog open={showMobileSettings} onOpenChange={setShowMobileSettings}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Compression Settings
            </DialogTitle>
            <DialogDescription>
              Adjust the compression parameters
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SettingsPanel />
          </div>
        </DialogContent>
      </Dialog>

      <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Desktop Settings Panel */}
          <div className="hidden lg:block lg:col-span-1 space-y-6">
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
                  <SettingsPanel />
                </CardContent>
              </ScrollArea>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <Card
              className={`bg-card/70 backdrop-blur-sm border shadow-lg min-h-[calc(100vh-140px)] lg:h-[calc(100vh-120px)] flex flex-col transition-all duration-200 ${
                isDragging
                  ? "border-primary border-2 bg-primary/5 scale-[1.02]"
                  : "border-border hover:border-primary/30"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
            >
              <CardHeader className="pb-3 lg:pb-4 flex-shrink-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                  <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
                    <Image className="h-4 w-4 lg:h-5 lg:w-5" />
                    {files.length === 0
                      ? "Drop Images or Click to Add"
                      : `Files (${files.length})`}
                  </CardTitle>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 flex-1 sm:flex-none"
                      >
                        <Upload className="h-4 w-4" />
                        <span className="hidden xs:inline">Add Images</span>
                        <span className="xs:hidden">Add</span>
                      </Button>
                      <Button
                        onClick={compressFiles}
                        variant="default"
                        disabled={
                          isCompressing ||
                          files.length === 0 ||
                          files.every((f) => f.status !== "pending")
                        }
                        className="flex items-center gap-2 flex-1 sm:flex-none"
                        size="sm"
                      >
                        {isCompressing ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            <span className="hidden sm:inline">
                              Compressing...
                            </span>
                            <span className="sm:hidden">Wait...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 shrink-0" />
                            <span className="hidden sm:inline">
                              Compress{" "}
                              {files.filter((f) => f.status === "pending").length}{" "}
                              Images
                            </span>
                            <span className="sm:hidden">
                              Compress ({files.filter((f) => f.status === "pending").length})
                            </span>
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {files.length > 0 && (
                      <div className="flex gap-2">
                        {files.some((f) => f.compressedSize) && (
                          <Button
                            onClick={downloadAllAsZip}
                            variant="outline"
                            size="sm"
                            disabled={isCreatingZip}
                            className="flex items-center gap-2 flex-1 sm:flex-none"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden xs:inline">Download All</span>
                            <span className="xs:hidden">Download</span>
                          </Button>
                        )}
                        <Button
                          onClick={clearAllFiles}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 flex-1 sm:flex-none"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden xs:inline">Clear All</span>
                          <span className="xs:hidden">Clear</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden p-3 sm:p-6">
                {files.length === 0 ? (
                  <div
                    className={`h-full flex items-center justify-center text-center cursor-pointer transition-all duration-200 rounded-lg border-2 border-dashed ${
                      isDragging
                        ? "border-primary bg-primary/10"
                        : "border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/20"
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-muted-foreground py-8 lg:py-12 px-4">
                      <Upload
                        className={`h-12 lg:h-16 w-12 lg:w-16 mx-auto mb-4 lg:mb-6 transition-colors ${
                          isDragging ? "text-primary" : ""
                        }`}
                      />
                      <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3">
                        {isDragging
                          ? "Drop your images here!"
                          : "Drop images here or click to select"}
                      </h3>
                      <p className="text-sm mb-3 lg:mb-4">
                        Supports JPEG, PNG, WebP, GIF, HEIC and other image formats
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs text-muted-foreground/70">
                        <span>• Drag & Drop</span>
                        <span>• Multiple files</span>
                        <span>• Batch compression</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full relative">
                    <ScrollArea className="h-full">
                      <div className="space-y-3 lg:space-y-4 pr-2 lg:pr-4">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 lg:p-4 bg-muted/30 rounded-lg border hover:bg-muted/50 transition-colors gap-3 sm:gap-0"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {file.preview ? (
                                  <img
                                    src={file.preview}
                                    alt={file.originalFile.name}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                ) : (
                                  <Image className="h-5 w-5 lg:h-6 lg:w-6 text-primary" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium truncate text-sm lg:text-base">
                                    {file.originalFile.name}
                                  </p>
                                  {file.status === "completed" && (
                                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  )}
                                  {file.status === "error" && (
                                    <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                                  )}
                                </div>
                                <div className="flex flex-col xs:flex-row xs:items-center gap-1 xs:gap-4 text-xs lg:text-sm text-muted-foreground mt-1">
                                  <span>{formatFileSize(file.originalSize)}</span>
                                  {file.compressedSize && (
                                    <div className="flex items-center gap-2">
                                      <span className="hidden xs:inline">→</span>
                                      <span className="text-primary font-medium">
                                        {formatFileSize(file.compressedSize)}
                                      </span>
                                      {file.compressionRatio && (
                                        <Badge variant="secondary" className="text-xs">
                                          -{file.compressionRatio.toFixed(1)}%
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {file.status === "compressing" && (
                                  <div className="mt-2">
                                    <Progress value={file.progress} className="h-2" />
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

                            <div className="flex items-center gap-2 justify-end sm:ml-4">
                              {file.status === "completed" && file.compressedSize && (
                                <Button
                                  onClick={() => downloadFile(file)}
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 sm:flex-none"
                                >
                                  <Download className="h-4 w-4 sm:mr-0 mr-2" />
                                  <span className="sm:hidden">Download</span>
                                </Button>
                              )}

                              <Button
                                onClick={() => removeFile(file.id)}
                                size="sm"
                                variant="outline"
                                className="text-destructive hover:text-destructive flex-1 sm:flex-none"
                              >
                                <Trash2 className="h-4 w-4 sm:mr-0 mr-2" />
                                <span className="sm:hidden">Remove</span>
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
                          <Upload className="h-8 lg:h-12 w-8 lg:w-12 mx-auto mb-2" />
                          <p className="font-semibold text-sm lg:text-base">
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
}
