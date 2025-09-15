import { prisma } from "@/app/utils/db";
import { requireUser } from "@/app/utils/requireUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/general/EmptyState";
import { formatRelativeTime } from "@/app/utils/formatRelativeTime";
import { Eye, X, Download } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { withdrawApplication } from "@/app/actions";

async function getMyApplications(userId: string) {
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: userId,
    },
    include: {
      JobPost: {
        include: {
          Company: {
            select: {
              name: true,
              logo: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return applications;
}

export default async function MyApplicationsPage() {
  const user = await requireUser();
  const applications = await getMyApplications(user.id as string);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800";
      case "SHORTLISTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-800";
      case "WITHDRAWN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return "⏳";
      case "REVIEWED":
        return "👀";
      case "SHORTLISTED":
        return "⭐";
      case "REJECTED":
        return "❌";
      case "ACCEPTED":
        return "✅";
      case "WITHDRAWN":
        return "↩️";
      default:
        return "❓";
    }
  };

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications found"
        description="You haven't applied to any jobs yet. Start exploring opportunities!"
        buttonText="Browse Jobs"
        href="/"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Applications</h1>
        <p className="text-muted-foreground">
          Track the status of your job applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{applications.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter((app) => app.status === "PENDING").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shortlisted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                applications.filter((app) => app.status === "SHORTLISTED")
                  .length
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter((app) => app.status === "ACCEPTED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Application History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((application) => (
                <TableRow key={application.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {application.JobPost.jobTitle}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {application.JobPost.location} •{" "}
                        {application.JobPost.employmentTYpe}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Image
                        src={
                          application.JobPost.Company.logo ||
                          `https://avatar.vercel.sh/${application.JobPost.Company.name}`
                        }
                        alt={application.JobPost.Company.name}
                        width={24}
                        height={24}
                        className="rounded-full"
                      />
                      <span className="text-sm">
                        {application.JobPost.Company.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span>{getStatusIcon(application.status)}</span>
                      <Badge className={getStatusColor(application.status)}>
                        {application.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {formatRelativeTime(application.createdAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/job/${application.JobPost.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>

                      {application.resume && (
                        <Button variant="outline" size="sm" asChild>
                          <a
                            href={application.resume}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      )}

                      {application.status === "PENDING" && (
                        <form
                          action={async () => {
                            "use server";
                            await withdrawApplication(application.id);
                          }}
                        >
                          <Button variant="outline" size="sm" type="submit">
                            <X className="w-4 h-4" />
                          </Button>
                        </form>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
