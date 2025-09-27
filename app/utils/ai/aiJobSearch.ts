import { prisma } from "../db";

export interface JobSearchParams {
  keywords?: string[];
  location?: string;
  employmentType?: string;
  salaryRange?: { min?: number; max?: number };
  limit?: number;
  userId?: string;
}

export interface JobSearchResult {
  id: string;
  jobTitle: string;
  employmentTYpe: string; // Note: matches database schema typo
  location: string;
  salaryFrom: number;
  salaryTo: number;
  jobDescription: string;
  benefits: string[];
  createdAt: Date;
  Company: {
    name: string;
    logo: string | null;
    about: string;
    location: string;
    website: string;
  };
  _count: {
    JobApplications: number;
  };
}

export async function searchJobs(
  params: JobSearchParams
): Promise<JobSearchResult[]> {
  const whereClause: any = {
    status: "ACTIVE",
  };

  // Add keyword search
  if (params.keywords && params.keywords.length > 0) {
    whereClause.OR = params.keywords.map((keyword) => ({
      jobTitle: {
        contains: keyword,
        mode: "insensitive",
      },
    }));
  }

  // Add location filter
  if (params.location) {
    whereClause.location = {
      contains: params.location,
      mode: "insensitive",
    };
  }

  // Add employment type filter
  if (params.employmentType) {
    whereClause.employmentTYpe = {
      contains: params.employmentType,
      mode: "insensitive",
    };
  }

  // Add salary range filter
  if (params.salaryRange) {
    if (params.salaryRange.min) {
      whereClause.salaryTo = {
        gte: params.salaryRange.min,
      };
    }
    if (params.salaryRange.max) {
      whereClause.salaryFrom = {
        lte: params.salaryRange.max,
      };
    }
  }

  const jobs = await prisma.jobPost.findMany({
    where: whereClause,
    include: {
      Company: {
        select: {
          name: true,
          logo: true,
          about: true,
          location: true,
          website: true,
        },
      },
      _count: {
        select: {
          JobApplications: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: params.limit || 10,
  });

  return jobs;
}

export function extractJobSearchParams(query: string): JobSearchParams {
  const lowerQuery = query.toLowerCase();
  const params: JobSearchParams = { limit: 10 };

  // Extract keywords (job titles, skills, etc.)
  const jobKeywords = [
    "software engineer",
    "developer",
    "programmer",
    "carpenter",
    "plumber",
    "electrician",
    "teacher",
    "nurse",
    "doctor",
    "manager",
    "designer",
    "marketing",
    "sales",
    "accountant",
    "lawyer",
    "chef",
    "driver",
    "mechanic",
    "engineer",
    "analyst",
    "consultant",
    "writer",
    "editor",
    "data scientist",
    "product manager",
    "ui/ux",
    "frontend",
    "backend",
    "full stack",
    "devops",
    "qa",
    "tester",
    "admin",
    "receptionist",
    "customer service",
    "retail",
    "warehouse",
    "construction",
    "maintenance",
  ];

  const foundKeywords = jobKeywords.filter((keyword) =>
    lowerQuery.includes(keyword)
  );

  if (foundKeywords.length > 0) {
    params.keywords = foundKeywords;
  }

  // Extract location
  const locationPatterns = [
    /in\s+([a-zA-Z\s,]+)/,
    /at\s+([a-zA-Z\s,]+)/,
    /near\s+([a-zA-Z\s,]+)/,
    /from\s+([a-zA-Z\s,]+)/,
    /around\s+([a-zA-Z\s,]+)/,
  ];

  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      params.location = match[1].trim();
      break;
    }
  }

  // Extract employment type
  const employmentTypes = [
    "full-time",
    "part-time",
    "contract",
    "remote",
    "hybrid",
    "freelance",
  ];
  const foundEmploymentType = employmentTypes.find((type) =>
    lowerQuery.includes(type)
  );

  if (foundEmploymentType) {
    params.employmentType = foundEmploymentType;
  }

  // Extract salary range
  const salaryPattern =
    /(\$?\d+(?:,\d{3})*(?:k|K)?)\s*-\s*(\$?\d+(?:,\d{3})*(?:k|K)?)/;
  const salaryMatch = query.match(salaryPattern);

  if (salaryMatch) {
    const parseSalary = (salary: string) => {
      const num = salary.replace(/[$,kK]/g, "");
      return salary.toLowerCase().includes("k")
        ? parseInt(num) * 1000
        : parseInt(num);
    };

    params.salaryRange = {
      min: parseSalary(salaryMatch[1]),
      max: parseSalary(salaryMatch[2]),
    };
  }

  // Extract single salary minimum
  const minSalaryPattern =
    /(?:at least|minimum|from)\s*\$?(\d+(?:,\d{3})*(?:k|K)?)/;
  const minSalaryMatch = query.match(minSalaryPattern);

  if (minSalaryMatch) {
    const parseSalary = (salary: string) => {
      const num = salary.replace(/[$,kK]/g, "");
      return salary.toLowerCase().includes("k")
        ? parseInt(num) * 1000
        : parseInt(num);
    };

    params.salaryRange = {
      min: parseSalary(minSalaryMatch[1]),
    };
  }

  return params;
}

export function formatJobForAI(job: JobSearchResult) {
  return {
    id: job.id,
    title: job.jobTitle,
    company: job.Company.name,
    location: job.location,
    salary: `${job.salaryFrom} - ${job.salaryTo}`,
    employmentType: job.employmentTYpe, // Note: using database field name
    description: job.jobDescription.substring(0, 200) + "...",
    benefits: job.benefits,
    applicationCount: job._count.JobApplications,
    createdAt: job.createdAt,
    companyAbout: job.Company.about,
    website: job.Company.website,
  };
}
