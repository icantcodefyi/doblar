import React from "react";
import { IoSync, IoClose, IoDownloadOutline, IoReload } from "react-icons/io5";
import { 
  Select as ShadcnSelect, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useAtom } from "jotai";
import cn from "classnames";
import { useWorkerRefContext } from "$/imagemagick-worker";
import { LoadingIcon } from "$/components/LoadingIcon";
import { FileStatus, imageFileTypes, type ImageFileTypes } from "$/constants";
import type { PrimitiveAtom } from "jotai";
import { convertFile } from "$/utils/convertFile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const statusBoxRendering: {
  [key in FileStatus["status"]]: {
    variant: "default" | "secondary" | "destructive" | "outline";
    displayName: string;
    icon?: React.ReactNode;
  };
} = {
  "in-progress": {
    displayName: "Converting",
    variant: "secondary",
    icon: <LoadingIcon />,
  },
  "not-started": {
    displayName: "Ready",
    variant: "outline",
  },
  failed: {
    displayName: "Failed",
    variant: "destructive",
  },
  success: {
    displayName: "Finished",
    variant: "default",
  },
};

interface State {
  fileAtom: PrimitiveAtom<FileStatus>;
}

interface ActionButtonsProps extends State {
  removeFileToConvertAtom: (update: PrimitiveAtom<FileStatus>) => void
}

export const FileName: React.FC<State> = ({ fileAtom }) => {
  const [file, setFile] = useAtom(fileAtom)

  return (
    <p className="text-sm font-medium text-foreground truncate max-w-full" title={file.file.name}>
      {file.file.name}
    </p>
  );
};

export const Select: React.FC<State> = ({ fileAtom }) => {
  const [file, setFile] = useAtom(fileAtom)

  return (
    <ShadcnSelect
      disabled={file.status === "in-progress" || file.status === "success"}
      onValueChange={(value: string) => setFile({...file, "convertTo": value as ImageFileTypes})}
      value={file.convertTo || ""}
    >
      <SelectTrigger className="w-full h-8 text-sm">
        <SelectValue placeholder="Select format..." />
      </SelectTrigger>
      <SelectContent>
        {imageFileTypes.map((format) => (
          <SelectItem key={format} value={format}>
            {format.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
};

export const StatusTag: React.FC<State> = ({ fileAtom }) => {
  const [file, setFile] = useAtom(fileAtom)

  return (
    <Badge 
      variant={statusBoxRendering[file.status].variant}
      className="inline-flex items-center gap-1 text-xs"
      title={file.statusTooltip}
    >
      {statusBoxRendering[file.status].icon}
      {statusBoxRendering[file.status].displayName}
    </Badge>
  );
};

export const ActionButtons: React.FC<ActionButtonsProps> = ({ fileAtom, removeFileToConvertAtom }) => {
  const ref = useWorkerRefContext();
  const [file, setFile] = useAtom(fileAtom);

  return (
    <div className="flex items-center gap-1">
      {/* Convert button */}
      {file.status === "not-started" && (
        <Button
          size="sm"
          variant="default"
          title="Convert this file"
          aria-label="Convert this file"
          disabled={!(file.convertTo && ref?.current)}
          onClick={() => {
            setFile({ ...file, status: "in-progress" })     
            convertFile(file, ref!.current!).then((newFile) => setFile(newFile));
          }}
          className="h-8 w-8 p-0"
        >
          <IoSync size={14} />
        </Button>
      )}

      {/* Download button */}
      {file.status === "success" && (
        <Button
          size="sm"
          variant="success"
          asChild
          className="h-8 w-8 p-0"
        >
          <a
            title="Download this file"
            aria-label="Download this file"
            href={file.successData?.url}
            download={file.file.name
              .replace(/\.[^/.]+$/, "")
              .concat(".", file.convertTo as string)}
          >
            <IoDownloadOutline size={14} />
          </a>
        </Button>
      )}

      {/* Retry Button */}
      {file.status === "failed" && (
        <Button
          size="sm"
          variant="default"
          title="Retry conversion"
          aria-label="Retry conversion"
          disabled={!ref?.current}
          onClick={() => {
            setFile({ ...file, status: "in-progress" })      
            convertFile(file, ref!.current!).then((newFile) => setFile(newFile))
          }}
          className="h-8 w-8 p-0 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800"
        >
          <IoReload size={14} />
        </Button>
      )}

      <Button
        size="sm"
        variant="destructive"
        title="Remove this file"
        aria-label="Remove this file"
        onClick={() => removeFileToConvertAtom(fileAtom)}
        className="h-8 w-8 p-0"
      >
        <IoClose size={14} />
      </Button>
    </div>
  );
};
