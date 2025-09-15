"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Send, Paperclip, Plus, Search as SearchIcon } from "lucide-react";
import { Textarea } from "../ui/textarea";

interface AIChatInterfaceProps {
  onSendMessage?: (message: string) => void;
}

export function AIChatInterface({ onSendMessage }: AIChatInterfaceProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && onSendMessage) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickActions = [
    "Write cover letter for Software Engineer role",
    "Optimize my resume",
    "Research tech companies",
    "Practice interview questions",
  ];

  return (
    <Card className="shadow-xl">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-card-foreground">
              Skillbridge AI Assistant
            </h3>
            <p className="text-sm text-muted-foreground">
              Ready to help with your job search
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="relative">
          <div className="flex items-center space-x-2 mb-4">
            <Button variant="ghost" size="sm" className="p-2">
              <Paperclip className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <Plus className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <SearchIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Write your message..."
              className="flex-1 h-12 text-base pr-12"
            />
            <Button
              size="sm"
              className="size-10 px-6"
              onClick={handleSend}
              disabled={!message.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">Quick actions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setMessage(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
