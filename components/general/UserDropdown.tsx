import {
  ChevronDown,
  Heart,
  Layers2,
  LogOut,
  Briefcase,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { signOut } from "@/app/utils/auth";

interface iAppProps {
  email: string;
  name: string;
  image: string;
  userType: any;
}

export function UserDropdown({ email, name, image, userType }: iAppProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"ghost"} className="h-auto p-0 hover:bg-transparent">
          <Avatar>
            <AvatarImage src={image} alt="Profile Image" />
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
          </Avatar>

          <ChevronDown size={16} strokeWidth={2} className="ml-2 opacity-60" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-48 mt-2" align="end">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">{name}</span>
          <span className="text-xs font-medium text-muted-foreground">
            {email}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={"/favorites"}>
              <Heart size={16} strokeWidth={2} className="opacity-60" />
              <span className="ml-2">Favorite Jobs</span>
            </Link>
          </DropdownMenuItem>

          {/* Show different menu items based on user type */}
          {userType === "COMPANY" ? (
            <DropdownMenuItem asChild>
              <Link href={"/my-jobs"}>
                <Layers2 size={16} strokeWidth={2} className="opacity-60" />
                <span>My Job Listings</span>
              </Link>
            </DropdownMenuItem>
          ) : userType === "JOB_SEEKER" ? (
            <DropdownMenuItem asChild>
              <Link href={"/my-applications"}>
                <Briefcase size={16} strokeWidth={2} className="opacity-60" />
                <span>My Applications</span>
              </Link>
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form
            action={async () => {
              "use server"; // inline server action
              await signOut({
                redirectTo: "/",
              });
            }}
          >
            <button className="flex w-full items-center gap-2">
              <LogOut size={16} strokeWidth={2} className="opacity-60" />
              <span>Sign Out</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
