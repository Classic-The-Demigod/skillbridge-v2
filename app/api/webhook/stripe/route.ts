import { prisma } from "@/app/utils/db";
import { stripe } from "@/app/utils/stripe";
import { headers } from "next/headers";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET! as string
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return new Response("Webhook error", { status: 400 });
  }

  console.log("Received event:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Validate customer is a string
    if (typeof session.customer !== "string") {
      console.error("Customer is not a string ID:", typeof session.customer);
      return new Response("Invalid customer data", { status: 400 });
    }

    const customerId = session.customer;
    const jobId = session.metadata?.jobId;

    console.log("Processing payment for customer:", customerId, "job:", jobId);

    if (!jobId) {
      console.error("No job ID found in session metadata");
      return new Response("No job ID found", { status: 400 });
    }

    try {
      // Find the company
      const company = await prisma.user.findUnique({
        where: {
          stripeCustomerId: customerId as string,
        },
        select: {
          Company: {
            select: {
              id: true,
            },
          },
        },
      });

      console.log("Found company:", company);

      if (!company || !company.Company?.id) {
        console.error("Company not found for customer:", customerId);
        return new Response("Company not found", { status: 400 });
      }

      const companyId = company.Company.id;

      // First check if the job exists and belongs to this company
      const existingJob = await prisma.jobPost.findFirst({
        where: {
          id: jobId,
          userId: companyId,
        },
        select: {
          id: true,
          status: true,
        },
      });

      console.log("Existing job:", existingJob);

      if (!existingJob) {
        console.error(`Job ${jobId} not found for company ${companyId}`);
        return new Response("Job not found", { status: 400 });
      }

      // Update the job post status
      const updatedJob = await prisma.jobPost.update({
        where: {
          id: jobId,
          
        },
        data: {
          status: "ACTIVE",
        },
      });

      console.log("Successfully updated job:", updatedJob);
    } catch (error) {
      console.error("Database operation failed:", error);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response(null, { status: 200 });
}
