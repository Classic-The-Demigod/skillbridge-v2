import Link from "next/link";
import React from "react";
import Logo from "@/public/logo.png";
import Image from "next/image";
// import { Button, buttonVariants } from "../ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { auth } from "@/app/utils/auth";
import { UserDropdown } from "./UserDropdown";
import { prisma } from "@/app/utils/db";
import { MobileNav } from "./MobileNav";
import { Bot } from "lucide-react";

export async function Navbar() {
  const session = await auth();

  // Get user type if user is logged in
  let userType = null;
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { userType: true },
    });
    userType = user?.userType;
  }

  return (
    <nav className="flex items-center justify-between py-4 px-4 sm:px-6 lg:px-8">
      <Link href={"/"} className="flex items-center gap-2">
        <Image src={Logo} alt="skillbridge-logo" width={40} height={40} />
        <h1 className="text-xl sm:text-2xl font-bold">
          Skill<span className="text-primary">Bridge</span>
        </h1>
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-5">
        <ThemeToggle />

        {/* AI Assistant button for job seekers */}
        {session?.user && userType === "JOB_SEEKER" && (
          <Link
            className={buttonVariants({
              variant: "outline",
              size: "lg",
            })}
            href={"/ai-assistant"}
          >
            <Bot className="w-4 h-4 mr-2" />
            Ask Skillbridge AI
          </Link>
        )}

        {/* Only show Post Job button for companies */}
        {session?.user && userType === "COMPANY" && (
          <Link className={buttonVariants({ size: "lg" })} href={"/post-job"}>
            Post Job
          </Link>
        )}

        {session?.user ? (
          <UserDropdown
            email={session.user.email as string}
            image={session.user.image as string}
            name={session.user.name as string}
            userType={userType}
          />
        ) : (
          <Link
            className={buttonVariants({ variant: "outline", size: "lg" })}
            href={"/login"}
          >
            Login
          </Link>
        )}
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav session={session} userType={userType} />
      </div>
    </nav>
  );
}
