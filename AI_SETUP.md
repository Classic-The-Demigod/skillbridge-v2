# AI Features Setup Guide

This guide explains how to set up the AI job recommendation features using Vercel AI SDK and Google Gemini.

## Prerequisites

1. **Google Gemini API Key**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

## Environment Variables

Add the following environment variable to your `.env.local` file:

```bash
# AI - Google Gemini
GOOGLE_GEMINI_API_KEY="your-google-gemini-api-key"
```

## Features Implemented

### 1. AI Job Recommendation System

- **Streaming Responses**: Real-time AI responses using Vercel AI SDK
- **Smart Job Search**: Natural language job search with keyword extraction
- **Context-Aware**: Uses user profile and preferences for better recommendations
- **Interactive Chat**: Full chat interface with message history

### 2. Job Search Capabilities

- **Keyword Extraction**: Automatically detects job titles, skills, and roles
- **Location Filtering**: Supports location-based searches
- **Salary Range**: Extracts and filters by salary requirements
- **Employment Type**: Filters by full-time, part-time, remote, etc.

### 3. AI Chat Interface

- **Real-time Streaming**: Messages appear as they're generated
- **Quick Actions**: Pre-defined search queries for common job searches
- **Message History**: Persistent conversation context
- **Loading States**: Visual feedback during AI processing

## Usage Examples

Users can ask questions like:

- "Find recent software engineer jobs"
- "Show me carpenter jobs in New York"
- "Find remote marketing positions with $80k+ salary"
- "Get part-time teaching jobs near me"
- "What are the latest job postings?"

## Technical Implementation

### API Route: `/api/ai/chat`

- Handles streaming AI responses
- Integrates with Google Gemini 1.5 Flash
- Performs intelligent job search based on user queries
- Returns formatted job recommendations

### Components

- `AIChatInterface`: Main chat component with streaming support
- `aiJobSearch.ts`: Utility functions for job search and filtering
- `AIFeatureCard`: Feature cards for the AI assistant page

### Database Integration

- Searches active job postings
- Includes company information and application counts
- Filters by various criteria (location, salary, type, etc.)

## Getting Started

1. Install dependencies (already done):

   ```bash
   pnpm add ai @ai-sdk/google
   ```

2. Add your Google Gemini API key to environment variables

3. The AI assistant is available at `/ai-assistant` for job seekers

4. Start the development server:
   ```bash
   pnpm dev
   ```

## Customization

You can customize the AI behavior by modifying:

- `app/api/ai/chat/route.ts`: AI system prompts and job search logic
- `utils/aiJobSearch.ts`: Search parameters and filtering logic
- `components/ai/AIChatInterface.tsx`: Chat interface and quick actions

## Troubleshooting

- Ensure your Google Gemini API key is valid and has sufficient quota
- Check browser console for any API errors
- Verify database connection and job data availability
- Make sure user is logged in as a job seeker to access AI features
