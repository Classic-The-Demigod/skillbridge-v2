import { prisma } from "@/app/utils/db";
import { requireUser } from "@/app/utils/requireUser";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ApplicationsTable } from "@/components/forms/ApplicationsTable";

async function getJobWithApplications(jobId: string, userId: string) {
  const job = await prisma.jobPost.findUnique({
    where: {
      id: jobId,
      Company: {
        userId: userId,
      },
    },
    include: {
      Company: {
        select: {
          name: true,
        },
      },
      JobApplications: {
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              JobSeeker: {
                select: {
                  jobTitle: true,
                  about: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!job) {
    return notFound();
  }

  return job;
}

type Params = Promise<{ jobId: string }>;

export default async function JobApplicationsPage({
  params,
}: {
  params: Params;
}) {
  const { jobId } = await params;
  const user = await requireUser();

  const job = await getJobWithApplications(jobId, user.id as string);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{job.jobTitle}</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {job.Company.name} • {job.JobApplications.length} applications
          </p>
        </div>
        <Button asChild variant="outline" className="w-fit">
          <Link href="/my-jobs">Back to Jobs</Link>
        </Button>
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
            <div className="text-2xl font-bold">
              {job.JobApplications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                job.JobApplications.filter((app) => app.status === "PENDING")
                  .length
              }
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
                job.JobApplications.filter(
                  (app) => app.status === "SHORTLISTED"
                ).length
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
              {
                job.JobApplications.filter((app) => app.status === "ACCEPTED")
                  .length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applications Table with Search and Filtering */}
      <ApplicationsTable applications={job.JobApplications} jobId={jobId} />
    </div>
  );
}
