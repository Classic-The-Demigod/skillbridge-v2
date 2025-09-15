"use server";

import { requireUser } from "./utils/requireUser";
import { z } from "zod";
import { companySchema, jobSchema, jobSeekerSchema } from "./utils/zodSchemas";
import { prisma } from "./utils/db";
import { redirect } from "next/navigation";
import arcjet, { shield, detectBot } from "./utils/arcjet";
import { request } from "@arcjet/next";
import { stripe } from "./utils/stripe";
import { jobListingDurationPricing } from "./utils/pricingTiers";
import { inngest } from "./utils/inngest/client";
import { revalidatePath } from "next/cache";

const aj = arcjet
  .withRule(
    shield({
      mode: "LIVE",
    })
  )
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  );

export async function createCompany(data: z.infer<typeof companySchema>) {
  const session = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const validateData = companySchema.parse(data);

  await prisma.user.update({
    where: {
      id: session.id,
    },
    data: {
      onboardingCompleted: true,
      userType: "COMPANY",
      Company: {
        create: {
          ...validateData,
        },
      },
    },
  });
  return redirect("/");
}

export async function createJobSeeker(data: z.infer<typeof jobSeekerSchema>) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const validateData = jobSeekerSchema.parse(data);

  await prisma.user.update({
    where: {
      id: user.id as string,
    },
    data: {
      onboardingCompleted: true,
      userType: "JOB_SEEKER",
      JobSeeker: {
        create: {
          ...validateData,
        },
      },
    },
  });

  return redirect("/");
}

export async function createJob(data: z.infer<typeof jobSchema>) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);
  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const validatedData = jobSchema.parse(data); // Fixed: consistent naming

  const company = await prisma.company.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      user: {
        select: {
          stripeCustomerId: true,
        },
      },
    },
  });

  if (!company?.id) {
    return redirect("/");
  }

  let stripeCustomerId = company.user.stripeCustomerId;

  if (!stripeCustomerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email as string,
        name: user.name as string,
      });

      stripeCustomerId = customer.id;

      // update
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    } catch (error) {
      console.error("Failed to create Stripe customer:", error);
      throw new Error("Failed to create customer for payment processing");
    }
  }

  // Fixed: Assign the created job post to a variable
  const jobPost = await prisma.jobPost.create({
    data: {
      jobDescription: validatedData.jobDescription,
      jobTitle: validatedData.jobTitle,
      companyId: company.id,
      employmentTYpe: validatedData.employmentType, // Note: Check if this should be "employmentType"
      location: validatedData.location,
      salaryFrom: validatedData.salaryFrom,
      salaryTo: validatedData.salaryTo,
      listingDuration: validatedData.listingDuration,
      benefits: validatedData.benefits,
    },
  });

  // Get price from pricing tiers based on duration
  const pricingTier = jobListingDurationPricing.find(
    (tier) => tier.days === validatedData.listingDuration
  );

  if (!pricingTier) {
    console.error("Invalid listing duration:", validatedData.listingDuration);
    console.error(
      "Available durations:",
      jobListingDurationPricing.map((tier) => tier.days)
    );
    throw new Error("Invalid listing duration selected");
  }

  console.log("Creating checkout session with:", {
    customerId: stripeCustomerId,
    pricingTier,
    jobId: jobPost.id,
  });

  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  await inngest.send({
    name: "job/created",
    data: {
      jobId: jobPost.id,
      expirationDays: validatedData.listingDuration,
    },
  });

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    line_items: [
      {
        price_data: {
          product_data: {
            name: `Job Posting - ${pricingTier.days} Days`,
            description: pricingTier.description,
            images: [
              "https://pve1u6tfz1.ufs.sh/f/Ae8VfpRqE7c0gFltIEOxhiBIFftvV4DTM8a13LU5EyzGb2SQ",
            ],
          },
          currency: "USD",
          unit_amount: pricingTier.price * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      jobId: jobPost.id,
    },
    success_url: `${baseUrl}/payment/success`,
    cancel_url: `${baseUrl}/payment/cancel`,
  });

  return redirect(session.url as string);
}

export async function editJobPost(
  data: z.infer<typeof jobSchema>,
  jobId: string
) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const validatedData = jobSchema.parse(data);

  await prisma.jobPost.update({
    where: {
      id: jobId,
      Company: {
        userId: user.id,
      },
    },
    data: {
      jobDescription: validatedData.jobDescription,
      jobTitle: validatedData.jobTitle,
      employmentTYpe: validatedData.employmentType,
      location: validatedData.location,
      salaryFrom: validatedData.salaryFrom,
      salaryTo: validatedData.salaryTo,
      listingDuration: validatedData.listingDuration,
      benefits: validatedData.benefits,
    },
  });

  return redirect("/my-jobs");
}

export async function deleteJobPost(jobPostId: string) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  await prisma.jobPost.delete({
    where: {
      id: jobPostId,
      Company: {
        userId: user.id,
      },
    },
  });

  await inngest.send({
    name: "job/cancel.expiration",
    data: { jobId: jobPostId },
  });

  return redirect("/my-jobs");
}

export async function saveJobPost(jobPostId: string) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  await prisma.savedJobPost.create({
    data: {
      jobPostId: jobPostId,
      userId: user.id as string,
    },
  });

  revalidatePath(`/job/${jobPostId}`);
}

export async function unsaveJobPost(savedJobPostId: string) {
  const user = await requireUser();

  const req = await request();

  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  const data = await prisma.savedJobPost.delete({
    where: {
      id: savedJobPostId,
      userId: user.id as string,
    },
    select: {
      jobPostId: true,
    },
  });

  revalidatePath(`/job/${data.jobPostId}`);
}

// Job Application Actions
export async function applyToJob(
  jobPostId: string,
  coverLetter?: string,
  resume?: string
) {
  const user = await requireUser();

  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  // Check if user is a job seeker
  if (user.userType !== "JOB_SEEKER") {
    throw new Error("Only job seekers can apply to jobs");
  }

  // Check if job exists and is active
  const jobPost = await prisma.jobPost.findUnique({
    where: {
      id: jobPostId,
      status: "ACTIVE",
    },
  });

  if (!jobPost) {
    throw new Error("Job not found or not active");
  }

  // Check if user already applied
  const existingApplication = await prisma.jobApplication.findUnique({
    where: {
      userId_jobPostId: {
        userId: user.id as string,
        jobPostId: jobPostId,
      },
    },
  });

  if (existingApplication) {
    throw new Error("You have already applied to this job");
  }

  // Determine which resume to use: uploaded resume or profile resume
  let resumeToUse = resume;
  if (!resumeToUse) {
    // Get job seeker's resume from their profile
    const jobSeeker = await prisma.jobSeeker.findUnique({
      where: {
        userId: user.id as string,
      },
      select: {
        resume: true,
      },
    });
    resumeToUse = jobSeeker?.resume || null;
  }

  // Create application
  await prisma.jobApplication.create({
    data: {
      jobPostId,
      userId: user.id as string,
      coverLetter: coverLetter || null,
      resume: resumeToUse,
    },
  });

  revalidatePath(`/job/${jobPostId}`);
  revalidatePath("/my-applications");
}

export async function withdrawApplication(applicationId: string) {
  const user = await requireUser();

  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  // Update application status to withdrawn
  await prisma.jobApplication.update({
    where: {
      id: applicationId,
      userId: user.id as string,
    },
    data: {
      status: "WITHDRAWN",
    },
  });

  revalidatePath("/my-applications");
}

export async function updateApplicationStatus(
  applicationId: string,
  status: "PENDING" | "REVIEWED" | "SHORTLISTED" | "REJECTED" | "ACCEPTED"
) {
  const user = await requireUser();

  const req = await request();
  const decision = await aj.protect(req);

  if (decision.isDenied()) {
    throw new Error("Forbidden");
  }

  // Check if user is a company and owns the job
  const application = await prisma.jobApplication.findUnique({
    where: {
      id: applicationId,
    },
    include: {
      JobPost: {
        include: {
          Company: true,
        },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  if (application.JobPost.Company.userId !== user.id) {
    throw new Error("You can only update applications for your own jobs");
  }

  await prisma.jobApplication.update({
    where: {
      id: applicationId,
    },
    data: {
      status,
    },
  });

  revalidatePath("/my-jobs");
  revalidatePath(`/my-jobs/${application.jobPostId}/applications`);
}
