import React, { useState, useRef } from "react";
import classNames from "classnames";
import { IconType } from "react-icons";
import { useButton } from "react-aria";
import { Upload, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface DragDropFileProps {
  text: string;
  handleFiles: (files: File[]) => void;
  icon?: IconType;
  style?: React.CSSProperties;
  acceptableFileTypes?: string;
  className?: string;
}

export const DragDropFile: React.FC<DragDropFileProps> = (props) => {
  const ref = useRef<HTMLElement | null>(null);
  const { buttonProps } = useButton(props, ref);
  const [fileCurrentlyHovered, setFileCurrentlyHovered] = useState(false);
  const Icon = props.icon;

  // This is required to make the drop event listener work
  const handleDragOver: React.DragEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
  };

  // When a file is dragged into the drag area
  const handleDragEnter: React.DragEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    setFileCurrentlyHovered(true);
  };

  // When a file leaves the drag area
  const handleDragLeave: React.DragEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    setFileCurrentlyHovered(false);
  };

  // When a file is dropped
  const handleDrop: React.DragEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    setFileCurrentlyHovered(false);

    const files = Array.from(event.dataTransfer.files);
    props.handleFiles(files);
  };

  // When user clicks the area to select a file
  const handleOnClick: React.MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();

    let input: HTMLInputElement = document.createElement("input");

    input.setAttribute("type", "file");
    input.setAttribute("multiple", "");
    input.style.display = "none";
    
    if (props.acceptableFileTypes) {
      input.setAttribute("accept", props.acceptableFileTypes);
    }

    /*
    This is a really weird hack for which basically 
    gets run when the the file dialog is either cancelled 
    or a file is "uploaded"
    See https://stackoverflow.com/a/22900815/5721784
    */
    input.onclick = () => {
      document.body.onfocus = () => {
        setTimeout(() => {
          if(input.isConnected) {
            document.body.removeChild(input)
          }
        }, 100);
      };
    }

    input.addEventListener("change", () => {
      const files = Array.from(input.files!);
      props.handleFiles(files);
    });

    document.body.appendChild(input);
    input.click();
  };

  return (
    <button
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleOnClick}
      style={props.style}
      className={cn(
        "w-full h-full min-h-[300px] rounded-lg border-2 border-dashed border-border bg-card/50",
        "flex flex-col items-center justify-center p-8 text-center",
        "transition-all duration-200 ease-in-out",
        "hover:border-primary/50 hover:bg-accent",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "active:bg-accent/80",
        fileCurrentlyHovered && "border-primary bg-primary/10 text-primary",
        props.className
      )}
    >
      <div className="space-y-4">
        {/* Icon */}
        <div className={cn(
          "mx-auto w-16 h-16 rounded-full flex items-center justify-center",
          "bg-secondary text-secondary-foreground",
          fileCurrentlyHovered && "bg-primary/20 text-primary"
        )}>
          {Icon ? (
            <Icon size={32} />
          ) : fileCurrentlyHovered ? (
            <FileImage size={32} />
          ) : (
            <Upload size={32} />
      )}
        </div>
        
        {/* Text */}
        <div className="space-y-2">
          <p className={cn(
            "text-lg font-medium",
            fileCurrentlyHovered ? "text-primary" : "text-foreground"
          )}>
            {props.text}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports all major image formats
          </p>
        </div>
      </div>
    </button>
  );
};
