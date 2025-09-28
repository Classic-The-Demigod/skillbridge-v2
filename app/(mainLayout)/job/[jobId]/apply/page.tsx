import { prisma } from "@/app/utils/db";
import { requireUser } from "@/app/utils/requireUser";
import { notFound, redirect } from "next/navigation";
import { ApplicationForm } from "@/components/forms/ApplicationForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getFlagEmoji } from "@/app/utils/countriesList";

async function getJobDetails(jobId: string) {
  const job = await prisma.jobPost.findUnique({
    where: {
      id: jobId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      jobTitle: true,
      location: true,
      employmentTYpe: true,
      salaryFrom: true,
      salaryTo: true,
      createdAt: true,
      listingDuration: true,
      Company: {
        select: {
          name: true,
          logo: true,
          about: true,
        },
      },
    },
  });

  if (!job) {
    return notFound();
  }

  return job;
}

async function checkExistingApplication(jobId: string, userId: string) {
  const application = await prisma.jobApplication.findUnique({
    where: {
      userId_jobPostId: {
        userId: userId,
        jobPostId: jobId,
      },
    },
  });

  return application;
}

type Params = Promise<{ jobId: string }>;

export default async function ApplyToJobPage({ params }: { params: Params }) {
  const { jobId } = await params;
  const user = await requireUser();

  // Check if user is a job seeker
  if (user?.userType !== "JOB_SEEKER") {
    redirect("/");
  }

  const [job, existingApplication] = await Promise.all([
    getJobDetails(jobId),
    checkExistingApplication(jobId, user.id as string),
  ]);

  // If user already applied, redirect to applications page
  if (existingApplication) {
    redirect("/my-applications");
  }

  const locationFlag = getFlagEmoji(job.location);

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/job/${jobId}`}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Job
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Apply to Job</h1>
            <p className="text-muted-foreground">
              Submit your application for this position
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Job Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{job.jobTitle}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Image
                    src={
                      job.Company.logo ||
                      `https://avatar.vercel.sh/${job.Company.name}`
                    }
                    alt={job.Company.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium">
                    {job.Company.name}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {locationFlag && (
                        <span className="mr-1">{locationFlag}</span>
                      )}
                      {job.location}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{job.employmentTYpe}</span>
                  </div>

                  <div className="flex items-center space-x-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>
                      ${job.salaryFrom.toLocaleString()} - $
                      {job.salaryTo.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-2">
                    About {job.Company.name}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {job.Company.about}
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Posted</span>
                    <span>{job.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Expires</span>
                    <span>
                      {new Date(
                        job.createdAt.getTime() +
                          job.listingDuration * 24 * 60 * 60 * 1000
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="md:col-span-2">
            <ApplicationForm
              jobId={jobId}
              jobTitle={job.jobTitle}
              companyName={job.Company.name}
             
            />
          </div>
        </div>
      </div>
    </div>
  );
}
