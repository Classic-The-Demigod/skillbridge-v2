"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
// import { UserDropdown } from "./UserDropdown";
import {
  Menu,
  // X,
  User,
  LogOut,
  Heart,
  Layers2,
  Briefcase,
  Bot,
} from "lucide-react";
import { signOut } from "@/app/utils/auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface MobileNavProps {
  session: any;
  userType: any;
}

export function MobileNav({ session, userType }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirectTo: "/" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-[300px] sm:w-[400px] p-2">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col space-y-6 mt-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Theme</span>
            <ThemeToggle />
          </div>

          {/* User Section */}
          {session?.user ? (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={session.user.image as string}
                    alt="Profile"
                  />
                  <AvatarFallback>
                    {session.user.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.user.name || "User"}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {session.user.email}
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                <Link
                  href="/favorites"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-muted"
                  onClick={() => setIsOpen(false)}
                >
                  <Heart className="h-4 w-4" />
                  <span>Favorite Jobs</span>
                </Link>

                {userType === "COMPANY" ? (
                  <>
                    <Link
                      href="/post-job"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Layers2 className="h-4 w-4" />
                      <span>Post New Job</span>
                    </Link>
                    <Link
                      href="/my-jobs"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Layers2 className="h-4 w-4" />
                      <span>My Job Listings</span>
                    </Link>
                  </>
                ) : userType === "JOB_SEEKER" ? (
                  <>
                    <Link
                      href="/my-applications"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-muted"
                      onClick={() => setIsOpen(false)}
                    >
                      <Briefcase className="h-4 w-4" />
                      <span>My Applications</span>
                    </Link>
                    <Link
                      href="/ai-assistant"
                      className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm hover:bg-muted bg-muted border border-border"
                      onClick={() => setIsOpen(false)}
                    >
                      <Bot className="h-4 w-4" />
                      <span className="font-medium">Ask Skillbridge AI</span>
                    </Link>
                  </>
                ) : null}
              </div>

              {/* Sign Out */}
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Link
                href="/login"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
                onClick={() => setIsOpen(false)}
              >
                <User className="h-4 w-4 mr-2" />
                Login
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
