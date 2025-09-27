import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { prisma } from "../../utils/db";
import { requireUser } from "../../utils/requireUser";
import {
  extractJobSearchParams,
  searchJobs,
  formatJobForAI,
} from "../../utils/ai/aiJobSearch";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    console.log("AI Chat API called");

    // Check if Google Gemini API key is configured
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("GOOGLE_GENERATIVE_AI_API_KEY is not configured");
      return Response.json(
        {
          error:
            "AI service is not configured. Please add GOOGLE_GENERATIVE_AI_API_KEY to your .env.local file. Get your API key from: https://aistudio.google.com/app/apikey",
        },
        { status: 500 }
      );
    }

    console.log("API key found, proceeding with user authentication");

    const user = await requireUser();
    console.log("User authenticated:", user.id);

    if (user.userType !== "JOB_SEEKER") {
      return Response.json(
        { error: "Only job seekers can use AI assistant" },
        { status: 403 }
      );
    }

    const { messages }: { messages: Array<{ role: string; content: string }> } =
      await req.json();
    console.log("Messages received:", messages.length);

    if (!messages || messages.length === 0) {
      return Response.json({ error: "No messages provided" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];

    // Extract text content from the last message
    const userQuery = lastMessage.content || "";

    console.log("User query:", userQuery);

    if (!userQuery.trim()) {
      return Response.json(
        { error: "No valid message content found" },
        { status: 400 }
      );
    }

    // Extract job search parameters from user query
    console.log("Extracting job search parameters...");
    const searchParams = extractJobSearchParams(userQuery);
    searchParams.userId = user.id as string;

    console.log("Search params:", searchParams);

    // Get relevant jobs based on the query
    console.log("Searching for jobs...");
    const jobs = await searchJobs(searchParams);
    console.log("Jobs found:", jobs.length);

    // Get user's job seeker profile for context
    const jobSeekerProfile = await prisma.jobSeeker.findUnique({
      where: { userId: user.id as string },
      select: {
        name: true,
        jobTitle: true,
        about: true,
      },
    });

    console.log("Job seeker profile:", jobSeekerProfile);

    const systemPrompt = createSystemPrompt(
      jobs,
      jobSeekerProfile,
      searchParams
    );

    console.log("System prompt created, calling Gemini...");

    // Convert messages to the format expected by the AI model
    const modelMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    console.log("Model messages prepared:", modelMessages.length);

    // Generate AI response
    console.log("Calling Gemini API...");
    const result = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.7,
    });

    console.log("AI response generated successfully");

    // Return both AI response and job data
    return Response.json({
      message: result.text,
      jobs: jobs.map((job) => ({
        id: job.id,
        jobTitle: job.jobTitle,
        salaryFrom: job.salaryFrom,
        salaryTo: job.salaryTo,
        employmentTYpe: job.employmentTYpe,
        location: job.location,
        createdAt: job.createdAt,
        Company: {
          logo: job.Company.logo,
          name: job.Company.name,
          about: job.Company.about,
          location: job.Company.location,
        },
      })),
      searchParams: searchParams,
    });
  } catch (error) {
    console.error("AI Chat Error:", error);

    // Return a more specific error message
    if (error instanceof Error) {
      return Response.json(
        { error: `AI service error: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json(
      { error: "Failed to process AI request" },
      { status: 500 }
    );
  }
}

function createSystemPrompt(
  jobs: any[],
  jobSeekerProfile: any,
  searchParams: any
): string {
  const jobList = jobs.map((job) => formatJobForAI(job));

  return `You are SkillBridge AI, a helpful job search assistant for job seekers. Your role is to:

1. **Analyze job search queries** and provide relevant job recommendations
2. **Present job opportunities** in an engaging, conversational way
3. **Highlight key details** like salary, location, company info, and benefits
4. **Provide actionable advice** about applications and next steps
5. **Be encouraging and supportive** throughout the job search process

**Current User Profile:**
- Name: ${jobSeekerProfile?.name || "Job Seeker"}
- Current Role: ${jobSeekerProfile?.jobTitle || "Not specified"}
- About: ${jobSeekerProfile?.about || "No description provided"}

**Search Parameters:**
- Keywords: ${searchParams.keywords?.join(", ") || "None specified"}
- Location: ${searchParams.location || "Any location"}
- Employment Type: ${searchParams.employmentType || "Any type"}
- Salary Range: ${
    searchParams.salaryRange
      ? `$${searchParams.salaryRange.min} - $${searchParams.salaryRange.max}`
      : "Any salary"
  }

**Available Jobs (${jobs.length} found):**
${JSON.stringify(jobList, null, 2)}

**Instructions:**
- If jobs are found, present them in an engaging way with key highlights
- If no jobs match, suggest alternative search terms or broader criteria
- Always include job IDs for reference
- Mention application counts to show job popularity
- Provide tips for applying or improving search results
- Be conversational and encouraging
- Use emojis sparingly but effectively
- Keep responses concise but informative

**Response Format:**
Start with a brief acknowledgment of their search, then present the jobs with clear formatting, and end with helpful next steps or tips.`;
}
