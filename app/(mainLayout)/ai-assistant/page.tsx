"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AIFeatureCard } from "@/components/ai/AIFeatureCard";
import { AIChatInterface } from "@/components/ai/AIChatInterface";
import {
  Bot,
  FileText,
  Image,
  Search,
  FileEdit,
  BarChart3,
  Code,
} from "lucide-react";

export default function AIAssistantPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/session");
        const session = await response.json();

        if (!session?.user) {
          router.push("/login");
          return;
        }

        // Fetch user details including userType
        const userResponse = await fetch("/api/user/profile");
        const userData = await userResponse.json();

        if (userData.userType !== "JOB_SEEKER") {
          router.push("/");
          return;
        }

        setUser(userData);
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mb-4 mx-auto">
            <Bot className="w-8 h-8 text-primary-foreground animate-pulse" />
          </div>
          <p className="text-muted-foreground">Loading AI Assistant...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const aiFeatures = [
    {
      icon: FileText,
      title: "Write Cover Letter",
      description: "Craft compelling cover letters tailored to specific jobs.",
    },
    {
      icon: FileEdit,
      title: "Optimize Resume",
      description: "Improve your resume with AI-powered suggestions.",
    },
    {
      icon: Search,
      title: "Research Companies",
      description: "Get insights about companies and job opportunities.",
    },
    {
      icon: Image,
      title: "Generate Headshots",
      description: "Create professional headshots for your profile.",
    },
    {
      icon: BarChart3,
      title: "Interview Prep",
      description: "Practice with AI-powered interview questions.",
    },
    {
      icon: Code,
      title: "Portfolio Builder",
      description: "Create stunning portfolio websites quickly.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary mb-6">
            <Bot className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Welcome, {user.name?.split(" ")[0] || "Job Seeker"}
          </h1>
          <p className="text-xl text-muted-foreground mb-2">
            Start by scripting a task, and let the AI take over.
          </p>
          <p className="text-sm text-muted-foreground">
            Not sure where to start? Try one of the features below.
          </p>
        </div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {aiFeatures.map((feature, index) => (
            <AIFeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onClick={() => {
                // TODO: Implement feature-specific functionality
                console.log(`Clicked on ${feature.title}`);
              }}
            />
          ))}
        </div>

        {/* Chat Interface */}
        <AIChatInterface />
      </div>
    </div>
  );
}
