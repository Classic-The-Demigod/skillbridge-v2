"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatRelativeTime } from "@/app/utils/formatRelativeTime";
import { Eye, Download, Mail } from "lucide-react";
import Link from "next/link";
import { ApplicationStatusUpdate } from "@/components/forms/ApplicationStatusUpdate";
import { ApplicationFilters } from "@/components/forms/ApplicationFilters";

interface Application {
  id: string;
  status: string;
  coverLetter: string | null;
  resume: string | null;
  createdAt: Date;
  updatedAt: Date;
  User: {
    id: string;
    name: string | null;
    email: string;
    JobSeeker: {
      jobTitle: string;
      about: string;
    } | null;
  };
}

interface ApplicationsTableProps {
  applications: Application[];
  jobId: string;
}

export function ApplicationsTable({
  applications,
  jobId,
}: ApplicationsTableProps) {
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800";
      case "SHORTLISTED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "ACCEPTED":
        return "bg-emerald-100 text-emerald-800";
      case "WITHDRAWN":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAndSortedApplications = useMemo(() => {
    let filtered = applications;

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.User.name?.toLowerCase().includes(searchLower) ||
          app.User.email.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (filters.status !== "ALL") {
      filtered = filtered.filter((app) => app.status === filters.status);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case "name":
          aValue = a.User.name || "";
          bValue = b.User.name || "";
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "createdAt":
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (filters.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [applications, filters]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <ApplicationFilters
        onFiltersChange={setFilters}
        initialFilters={filters}
      />

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Applications ({filteredAndSortedApplications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAndSortedApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {applications.length === 0
                  ? "No applications yet"
                  : "No applications match your filters"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Candidate</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Position
                    </TableHead>
                    <TableHead className="min-w-[100px]">Status</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Applied
                    </TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedApplications.map((application) => (
                    <TableRow key={application.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {application.User.name || "Anonymous"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {application.User.email}
                          </div>
                          {application.User.JobSeeker?.jobTitle && (
                            <div className="text-xs text-muted-foreground sm:hidden">
                              {application.User.JobSeeker.jobTitle}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="text-sm">
                          {application.User.JobSeeker?.jobTitle ||
                            "Not specified"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatRelativeTime(application.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <div className="flex items-center gap-1">
                            <ApplicationStatusUpdate
                              applicationId={application.id}
                              currentStatus={application.status}
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/my-jobs/${jobId}/applications/${application.id}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>

                            {application.resume && (
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={application.resume}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            )}

                            <Button variant="outline" size="sm" asChild>
                              <a href={`mailto:${application.User.email}`}>
                                <Mail className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {formatRelativeTime(application.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
