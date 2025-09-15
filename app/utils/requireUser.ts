import { redirect } from "next/navigation";
import { auth } from "./auth";
import { prisma } from "./db";

export async function requireUser() {
  const session = await auth();

  if (!session?.user) {
    return redirect("/login");
  }

  // Fetch the complete user data including userType
  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id as string,
    },
    select: {
      id: true,
      name: true,
      email: true,
      userType: true,
      onboardingCompleted: true,
    },
  });

  if (!user) {
    return redirect("/login");
  }

  return user;
}
