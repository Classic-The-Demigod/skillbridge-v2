"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { UploadDropzone } from "../general/UploadThingReexported";
import { applyToJob } from "@/app/actions";
import { toast } from "sonner";
import { XIcon } from "lucide-react";
import Image from "next/image";
import PdfImage from "@/public/pdf.png";

const applicationSchema = z.object({
  coverLetter: z
    .string()
    .min(10, "Cover letter must be at least 10 characters"),
  resume: z.string().optional(),
});

type ApplicationFormData = z.infer<typeof applicationSchema>;

interface ApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess?: () => void;
}

export function ApplicationForm({
  jobId,
  jobTitle,
  companyName,
  onSuccess,
}: ApplicationFormProps) {
  const [pending, setPending] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string>("");

  const form = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      coverLetter: "",
      resume: "",
    },
  });

  const onSubmit = async (data: ApplicationFormData) => {
    try {
      setPending(true);
      await applyToJob(jobId, data.coverLetter, resumeUrl);
      toast.success("Application submitted successfully!");
      onSuccess?.();
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to submit application");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Apply to {jobTitle}</CardTitle>
        <p className="text-sm text-muted-foreground">
          Apply for this position at {companyName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Cover Letter</label>
            <Textarea
              {...form.register("coverLetter")}
              placeholder="Tell us why you're interested in this position and what makes you a great fit..."
              className="min-h-[120px]"
            />
            {form.formState.errors.coverLetter && (
              <p className="text-sm text-red-500">
                {form.formState.errors.coverLetter.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Resume (Optional)</label>
            <p className="text-xs text-muted-foreground">
              Upload a new resume or use the one from your profile
            </p>
            {resumeUrl ? (
              <div className="relative w-fit">
                <Image
                  src={PdfImage}
                  alt="Pdf Resume Image"
                  width={100}
                  height={100}
                  className="rounded-lg"
                />
                <Button
                  variant="destructive"
                  size={"icon"}
                  type="button"
                  className="absolute -top-2 -right-2"
                  onClick={() => setResumeUrl("")}
                >
                  <XIcon className="size-4" />
                </Button>
              </div>
            ) : (
              <UploadDropzone
                endpoint="resumeUploader"
                onClientUploadComplete={(res) => {
                  setResumeUrl(res[0].ufsUrl);
                }}
                onUploadError={() => {
                  toast.error("Failed to upload resume");
                }}
                className="ut-button:bg-primary ut-button:text-white ut-button:hover:bg-primary/90 ut-label:text-muted-foreground ut-allowed-content:text-muted-foreground border-primary"
              />
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> If you don't upload a new resume, your
              profile resume will be used automatically.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={pending} className="flex-1">
              {pending ? "Submitting..." : "Submit Application"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onSuccess}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
