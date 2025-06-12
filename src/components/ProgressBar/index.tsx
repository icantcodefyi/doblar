import React from "react";
import { Progress } from "@/components/ui/progress";

export interface ProgressBarProps {
  minValue?: number;
  maxValue?: number;
  value?: number;
  determinate?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  minValue = 0,
  maxValue = 100,
  value,
  determinate,
}) => {
  if(value === undefined && determinate === undefined) {
    determinate = false;
  }
  else if(determinate === true && value === undefined) {
    throw Error("You must pass in a value if you want the progress bar to be determinate")
  }
  else if (determinate == undefined) {
    determinate = true;
  }
  
  if (determinate) {
    const progressValue = (value! / maxValue) * 100;
    return (
      <Progress 
        value={progressValue} 
        className="w-full h-2.5" 
        aria-valuenow={value}
        aria-valuemin={minValue}
        aria-valuemax={maxValue}
      />
    );
  }

  // Indeterminate progress bar
  return (
    <div
      className="w-full bg-secondary rounded-full h-2.5 relative overflow-hidden"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={minValue}
      aria-valuemax={maxValue}
    >
      <div
        className="h-2.5 rounded-full bg-primary absolute w-[35%] animate-pulse"
        style={{
          animation: "slide 2s ease-in-out infinite",
          left: "-50%"
        }}
      />
    </div>
  );
};
