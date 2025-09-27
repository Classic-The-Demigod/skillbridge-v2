"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Bot,
  Send,
  Paperclip,
  Plus,
  Search as SearchIcon,
  Loader2,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Skeleton } from "../ui/skeleton";
import { JobCard } from "../general/JobCard";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  jobs?: any[];
  timestamp: Date;
}

interface AIChatInterfaceProps {
  onSendMessage?: (message: string) => void;
}

export function AIChatInterface({ onSendMessage }: AIChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        jobs: data.jobs || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error("AI Chat Error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage(input);
        setInput("");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const clearError = () => setError(null);
  const stop = () => setIsLoading(false);

  const quickActions = [
    "Find recent software engineer jobs",
    "Show me carpenter jobs in New York",
    "Find remote marketing positions",
    "Get jobs with $80k+ salary",
    "Find part-time teaching jobs",
    "Show me recent job postings",
  ];

  return (
    <div className="flex flex-col h-[600px]">
      <Card className="shadow-xl flex-1 flex flex-col">
        <CardContent className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
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
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessages([])}
                className="text-xs"
                disabled={isLoading}
              >
                Clear Chat
              </Button>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto mb-4 space-y-4 min-h-[300px]">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation to find your next job opportunity!</p>
                <p className="text-sm mt-2">
                  Try asking: "Find recent software engineer jobs"
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className="space-y-4">
                <div
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">
                      {msg.role === "assistant" ? "Gemini: " : ""}
                      {msg.content}
                    </div>
                  </div>
                </div>

                {/* Job Cards for Assistant Messages */}
                {msg.role === "assistant" &&
                  msg.jobs &&
                  msg.jobs.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground px-2">
                        Recommended Jobs ({msg.jobs.length})
                      </div>
                      <div className="space-y-3">
                        {msg.jobs.map((job: any) => (
                          <JobCard key={job.id} job={job} />
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            ))}

            {isLoading && (
              <div className="space-y-4">
                <div className="flex justify-start">
                  <div className="bg-muted text-muted-foreground rounded-lg p-3 flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AI is thinking...</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={stop}
                      className="ml-2 h-6 px-2 text-xs"
                    >
                      Stop
                    </Button>
                  </div>
                </div>

                {/* Loading Skeleton for Job Cards */}
                <div className="space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6">
                        <div className="flex flex-col md:flex-row gap-4">
                          <Skeleton className="size-12 rounded-lg" />
                          <div className="flex flex-col flex-grow space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <div className="flex flex-wrap items-center gap-2">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-16" />
                              <Skeleton className="h-4 w-20" />
                              <Skeleton className="h-4 w-32" />
                            </div>
                          </div>
                          <div className="md:ml-auto space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                        <div className="mt-5">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-2/3 mt-1" />
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-destructive/10 text-destructive rounded-lg p-3 flex items-center space-x-2">
                  <span>Error: {error.message}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearError}
                    className="ml-2 h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Button variant="ghost" size="sm" className="p-2" type="button">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" type="button">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="p-2" type="button">
                <SearchIcon className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about jobs, get recommendations, or search for opportunities..."
                className="flex-1 h-12 text-base pr-12"
                disabled={isLoading}
              />
              <Button
                type={isLoading ? "button" : "submit"}
                size="sm"
                className="size-10 px-6"
                disabled={!input.trim() && !isLoading}
                onClick={isLoading ? stop : undefined}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </form>

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
                  onClick={() => {
                    sendMessage(action);
                  }}
                  disabled={isLoading}
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
