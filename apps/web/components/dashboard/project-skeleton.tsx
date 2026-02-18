"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProjectCardSkeleton() {
  return (
    <Card className="border border-border/50" style={{ borderRadius: "12px" }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-12 ml-auto" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
        </div>
      </CardContent>
      <CardFooter className="px-5 py-3 bg-muted/20 border-t">
        <div className="flex items-center justify-between w-full">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}

interface ProjectGridSkeletonProps {
  count?: number;
}

export function ProjectGridSkeleton({ count = 6 }: ProjectGridSkeletonProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
