import React from "react";
import { Card as ShadcnCard, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface CardProps {
  title: React.ReactNode | string;
  icon: React.ComponentType<{ className: string; size: number }>;
  tag?: React.ReactNode | string;
  description: React.ReactNode | string;
}

export const Card: React.FC<CardProps> = ({ title, icon, tag, description }) => {
  const Icon = icon;
  return (
    <ShadcnCard className="border hover:shadow-lg transition-shadow duration-200 bg-card/70 backdrop-blur-sm">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto w-20 h-20 rounded-full bg-secondary flex items-center justify-center mb-4">
          <Icon className="text-secondary-foreground" size={40} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-center items-center gap-2">
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            {tag && (
              <Badge variant="secondary" className="text-xs">
                {tag}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="text-center pt-0">
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </CardContent>
    </ShadcnCard>
  );
};
