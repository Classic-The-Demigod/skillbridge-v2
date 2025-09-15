"use client";

import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface AIFeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick?: () => void;
}

export function AIFeatureCard({
  icon: IconComponent,
  title,
  description,
  onClick,
}: AIFeatureCardProps) {
  return (
    <Card
      className="hover:shadow-lg transition-all duration-300 cursor-pointer group hover:scale-105 border-border"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className="p-3 rounded-lg bg-muted">
            <IconComponent className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
