import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JobFilters } from "../../components/general/JobFilters";
import JobListings from "../../components/general/JobListings";
import JobListingsLoading from "../../components/general/JobListingsLoading";
import { Suspense } from "react";
import { auth } from "../utils/auth";
import { prisma } from "../utils/db";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, Users, TrendingUp } from "lucide-react";
import Link from "next/link";

type SearchParams = {
  searchParams: Promise<{
    page?: string;
    jobTypes?: string;
    location?: string;
  }>;
};

async function getCompanyStats(userId: string) {
  const [totalJobs, activeJobs, totalApplications] = await Promise.all([
    prisma.jobPost.count({
      where: {
        Company: {
          userId: userId,
        },
      },
    }),
    prisma.jobPost.count({
      where: {
        Company: {
          userId: userId,
        },
        status: "ACTIVE",
      },
    }),
    prisma.jobApplication.count({
      where: {
        JobPost: {
          Company: {
            userId: userId,
          },
        },
      },
    }),
  ]);

  return { totalJobs, activeJobs, totalApplications };
}

async function getJobSeekerStats(userId: string) {
  const [totalApplications, pendingApplications, recentJobs] =
    await Promise.all([
      prisma.jobApplication.count({
        where: {
          userId: userId,
        },
      }),
      prisma.jobApplication.count({
        where: {
          userId: userId,
          status: "PENDING",
        },
      }),
      prisma.jobPost.findMany({
        where: {
          status: "ACTIVE",
        },
        take: 5,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          jobTitle: true,
          location: true,
          salaryFrom: true,
          salaryTo: true,
          Company: {
            select: {
              name: true,
              logo: true,
            },
          },
        },
      }),
    ]);

  return { totalApplications, pendingApplications, recentJobs };
}

export default async function Home({ searchParams }: SearchParams) {
  const session = await auth();
  const params = await searchParams;

  const currentPage = Number(params.page) || 1;
  const jobTypes = params.jobTypes ? params.jobTypes.split(",") : [];
  const location = params.location || "";

  const filterKey = `page=${currentPage};types=${jobTypes.join(
    ","
  )};location=${location}`;

  // If user is not logged in, show public job listings
  if (!session?.user) {
    return (
      <div className="grid md:grid-cols-3 gap-8">
        <JobFilters />
        <div className="col-span-2 flex flex-col gap-6">
          <Suspense fallback={<JobListingsLoading />} key={filterKey}>
            <JobListings
              currentPage={currentPage}
              jobTypes={jobTypes}
              location={location}
            />
          </Suspense>
        </div>
      </div>
    );
  }

  // Show different content based on user type
  if (session.user.userType === "COMPANY") {
    const stats = await getCompanyStats(session.user.id as string);

    return (
      <div className="space-y-8">
        {/* Company Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Company Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your job postings and applications
            </p>
          </div>
          <Button asChild>
            <Link href="/post-job">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalJobs}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activeJobs} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalApplications}
              </div>
              <p className="text-xs text-muted-foreground">Total received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeJobs}</div>
              <p className="text-xs text-muted-foreground">Currently live</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/post-job">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/my-jobs">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Manage Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                You have {stats.totalApplications} total applications across all
                your jobs.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="grid md:grid-cols-3 gap-8">
          <JobFilters />
          <div className="col-span-2 flex flex-col gap-6">
            <Suspense fallback={<JobListingsLoading />} key={filterKey}>
              <JobListings
                currentPage={currentPage}
                jobTypes={jobTypes}
                location={location}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  // Job Seeker Dashboard
  if (session.user.userType === "JOB_SEEKER") {
    const stats = await getJobSeekerStats(session.user.id as string);

    return (
      <div className="space-y-8">
        {/* Job Seeker Dashboard Header */}
        <div>
          <h1 className="text-3xl font-bold">Find Your Next Job</h1>
          <p className="text-muted-foreground">
            Discover opportunities that match your skills and interests
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Applications
              </CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalApplications}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingApplications} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                My Applications
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.totalApplications}
              </div>
              <p className="text-xs text-muted-foreground">Total submitted</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-start">
                <Link href="/my-applications">
                  <Briefcase className="w-4 h-4 mr-2" />
                  View My Applications
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start"
              >
                <Link href="/favorites">
                  <Users className="w-4 h-4 mr-2" />
                  Saved Jobs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentJobs.map((job) => (
                  <div key={job.id} className="flex items-center space-x-3">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {job.jobTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.Company.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Listings */}
        <div className="grid md:grid-cols-3 gap-8">
          <JobFilters />
          <div className="col-span-2 flex flex-col gap-6">
            <Suspense fallback={<JobListingsLoading />} key={filterKey}>
              <JobListings
                currentPage={currentPage}
                jobTypes={jobTypes}
                location={location}
              />
            </Suspense>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for users without userType
  return (
    <div className="grid md:grid-cols-3 gap-8">
      <JobFilters />
      <div className="col-span-2 flex flex-col gap-6">
        <Suspense fallback={<JobListingsLoading />} key={filterKey}>
          <JobListings
            currentPage={currentPage}
            jobTypes={jobTypes}
            location={location}
          />
        </Suspense>
      </div>
    </div>
  );
}
