import { prisma } from "@/app/utils/db";
import { requireUser } from "@/app/utils/requireUser";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/app/utils/formatRelativeTime";
import {
  ArrowLeft,
  Download,
  Mail,
  User,
  Calendar,
  FileText,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { ApplicationStatusUpdate } from "@/components/forms/ApplicationStatusUpdate";

async function getApplicationDetails(applicationId: string, userId: string) {
  const application = await prisma.jobApplication.findFirst({
    where: {
      id: applicationId,
      JobPost: {
        Company: {
          userId: userId,
        },
      },
    },
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
      JobPost: {
        select: {
          id: true,
          jobTitle: true,
          Company: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  if (!application) {
    return notFound();
  }

  return application;
}

type Params = Promise<{ jobId: string; applicationId: string }>;

export default async function ApplicationDetailsPage({
  params,
}: {
  params: Params;
}) {
  const { jobId, applicationId } = await params;
  const user = await requireUser();

  const application = await getApplicationDetails(
    applicationId,
    user.id as string
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" size="sm" asChild className="w-fit">
            <Link href={`/my-jobs/${jobId}/applications`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Applications
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Application Details
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base">
              {application.JobPost.jobTitle} •{" "}
              {application.JobPost.Company.name}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Badge className={getStatusColor(application.status)}>
            {application.status}
          </Badge>
          <ApplicationStatusUpdate
            applicationId={application.id}
            currentStatus={application.status}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Cover Letter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Cover Letter
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.coverLetter ? (
                <div className="max-w-none">
                  <p className="whitespace-pre-wrap">
                    {application.coverLetter}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  No cover letter provided
                </p>
              )}
            </CardContent>
          </Card>

          {/* Resume */}
          {application.resume && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resume
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Resume uploaded by candidate
                    </p>
                  </div>
                  <Button asChild className="w-full sm:w-auto">
                    <a
                      href={application.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Candidate Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Candidate Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Name
                </label>
                <p className="text-lg font-semibold">
                  {application.User.name || "Anonymous"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email
                </label>
                <p className="text-sm">{application.User.email}</p>
              </div>

              {application.User.JobSeeker?.jobTitle && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Current Position
                  </label>
                  <p className="text-sm">
                    {application.User.JobSeeker.jobTitle}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Applied
                </label>
                <p className="text-sm flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatRelativeTime(application.createdAt)}
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <a href={`mailto:${application.User.email}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Candidate
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Candidate Bio */}
          {application.User.JobSeeker?.about && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  About Candidate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none text-sm">
                  <p className="whitespace-pre-wrap">
                    {application.User.JobSeeker.about}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Application Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Application Submitted</p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(application.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">
                      Status: {application.status}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last updated {formatRelativeTime(application.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
