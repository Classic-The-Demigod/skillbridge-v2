"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateApplicationStatus } from "@/app/actions";
import { toast } from "sonner";

interface ApplicationStatusUpdateProps {
  applicationId: string;
  currentStatus: string;
}

export function ApplicationStatusUpdate({
  applicationId,
  currentStatus,
}: ApplicationStatusUpdateProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    try {
      setIsUpdating(true);
      await updateApplicationStatus(applicationId, newStatus as any);
      toast.success("Application status updated successfully!");
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update application status");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-28 sm:w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PENDING">Pending</SelectItem>
        <SelectItem value="REVIEWED">Reviewed</SelectItem>
        <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
        <SelectItem value="REJECTED">Rejected</SelectItem>
        <SelectItem value="ACCEPTED">Accepted</SelectItem>
      </SelectContent>
    </Select>
  );
}
