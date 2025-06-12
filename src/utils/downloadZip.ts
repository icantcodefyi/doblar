import JSZip from "jszip";

interface DownloadableFile {
  data: Uint8Array | Blob;
  filename: string;
}

export const downloadAsZip = async (
  files: DownloadableFile[],
  zipFilename?: string
): Promise<void> => {
  if (files.length === 0) {
    console.warn("No files to download");
    return;
  }

  try {
    const zip = new JSZip();

    // Add each file to the zip
    for (const file of files) {
      zip.file(file.filename, file.data);
    }

    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Create download link
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = zipFilename || `files-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the blob URL
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Failed to create zip file:", error);
    throw new Error("Failed to create zip file");
  }
}; 