import { prisma } from "@/app/utils/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { notFound } from "next/navigation";

import { benefits } from "@/app/utils/listOfBenefits";
import Image from "next/image";
import { Heart } from "lucide-react";

import Link from "next/link";
import { auth } from "@/app/utils/auth";
import {

  SaveJobButton,
} from "@/components/general/SubmitButtons";
import { getFlagEmoji } from "@/app/utils/countriesList";
import { JsonToHtml } from "@/components/general/JsonToHtml";
import { saveJobPost, unsaveJobPost,  } from "@/app/actions";
import arcjet, { detectBot, tokenBucket } from "@/app/utils/arcjet";
import { request } from "@arcjet/next";

const aj = arcjet.withRule(
  detectBot({
    mode: "LIVE",
    allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
  })
);

function getClient(session: boolean) {
  if (session) {
    return aj.withRule(
      tokenBucket({
        mode: "LIVE",
        capacity: 100,
        interval: 60,
        refillRate: 30,
      })
    );
  } else {
    return aj.withRule(
      tokenBucket({
        mode: "LIVE",
        capacity: 100,
        interval: 60,
        refillRate: 10,
      })
    );
  }
}

async function getJob(jobId: string, userId?: string) {
  const [jobData, savedJob, application] = await Promise.all([
    prisma.jobPost.findUnique({
      where: {
        id: jobId,
        status: "ACTIVE",
      },
      select: {
        jobTitle: true,
        jobDescription: true,
        location: true,
        employmentTYpe: true,
        benefits: true,
        createdAt: true,
        listingDuration: true,
        Company: {
          select: {
            name: true,
            logo: true,
            location: true,
            about: true,
          },
        },
      },
    }),
    userId
      ? prisma.savedJobPost.findUnique({
          where: {
            userId_jobPostId: {
              userId: userId,
              jobPostId: jobId,
            },
          },
          select: {
            id: true,
          },
        })
      : null,
    userId
      ? prisma.jobApplication.findUnique({
          where: {
            userId_jobPostId: {
              userId: userId,
              jobPostId: jobId,
            },
          },
          select: {
            id: true,
            status: true,
          },
        })
      : null,
  ]);

  if (!jobData) {
    return notFound();
  }

  return {
    jobData,
    savedJob,
    application,
  };
}

type Params = Promise<{ jobId: string }>;

const JobIdPage = async ({ params }: { params: Params }) => {
  const { jobId } = await params;
  const req = await request();

  const session = await auth();

  const decision = await getClient(!!session).protect(req, { requested: 10 });

  if (decision.isDenied()) {
    throw new Error("forbidden");
  }

  const { jobData, savedJob, application } = await getJob(
    jobId,
    session?.user?.id
  );
  const locationFlag = getFlagEmoji(jobData.location);

  return (
    <div className="container mx-auto py-8">
      <div className="grid md:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="space-y-8 col-span-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">{jobData.jobTitle}</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-medium">{jobData.Company.name}</span>

                <Badge className="rounded-full" variant="secondary">
                  {jobData.employmentTYpe}
                </Badge>
                <span className="hidden md:inline text-muted-foreground">
                  •
                </span>
                <Badge className="rounded-full">
                  {locationFlag && <span className="mr-1">{locationFlag}</span>}
                  {jobData.location} Only
                </Badge>
              </div>
            </div>

            {session?.user ? (
              <form
                action={
                  savedJob
                    ? unsaveJobPost.bind(null, savedJob.id)
                    : saveJobPost.bind(null, jobId)
                }
              >
                <SaveJobButton savedJob={!!savedJob} />
              </form>
            ) : (
              <Button variant="outline" asChild>
                <Link href="/login">
                  <Heart className="size-4 mr-2" />
                  Save Job
                </Link>
              </Button>
            )}
          </div>

          <section>
            <JsonToHtml json={JSON.parse(jobData.jobDescription)} />
          </section>

          <section>
            <h3 className="font-semibold mb-4">
              Benefits{" "}
              <span className="text-sm text-muted-foreground font-normal">
                (green is offered and red is not offered)
              </span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {benefits.map((benefit) => {
                const isOffered = jobData.benefits.includes(benefit.id);
                return (
                  <Badge
                    key={benefit.id}
                    variant={isOffered ? "default" : "outline"}
                    className={`text-sm px-4 py-1.5 rounded-full ${
                      !isOffered && " opacity-75 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {benefit.icon}
                      {benefit.label}
                    </span>
                  </Badge>
                );
              })}
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6 col-span-1">
          {/* Apply Now Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Apply now</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Please let {jobData.Company.name} know you found this job on
                  SkillBridge. This helps us grow!
                </p>
              </div>

              {session?.user ? (
                application ? (
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600">✓</span>
                        <span className="text-sm font-medium text-blue-800">
                          Application Submitted
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Status: {application.status}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/my-applications">View My Applications</Link>
                    </Button>
                  </div>
                ) : session.user.userType === "JOB_SEEKER" ? (
                  <Button asChild className="w-full">
                    <Link href={`/job/${jobId}/apply`}>Apply Now</Link>
                  </Button>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Only job seekers can apply to jobs. Switch to job seeker
                      account to apply.
                    </p>
                  </div>
                )
              ) : (
                <Button asChild className="w-full">
                  <Link href="/login">Login to Apply</Link>
                </Button>
              )}
            </div>
          </Card>

          {/* Job Details Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <h3 className="font-semibold">About the job</h3>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Apply before
                  </span>
                  <span className="text-sm">
                    {new Date(
                      jobData.createdAt.getTime() +
                        jobData.listingDuration * 24 * 60 * 60 * 1000
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Posted on
                  </span>
                  <span className="text-sm">
                    {jobData.createdAt.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Employment type
                  </span>
                  <span className="text-sm">{jobData.employmentTYpe}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Location
                  </span>
                  <Badge variant="secondary">{jobData.location}</Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Company Card */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Image
                  src={
                    jobData.Company.logo ??
                    `https://avatar.vercel.sh/${jobData.Company.name}`
                  }
                  alt={jobData.Company.name}
                  width={48}
                  height={48}
                  className="rounded-full size-12"
                />
                <div>
                  <h3 className="font-semibold">{jobData.Company.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {jobData.Company.about}
                  </p>
                </div>
              </div>
              {/*  <Button variant="outline" className="w-full">
                View company profile
              </Button> */}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobIdPage;
