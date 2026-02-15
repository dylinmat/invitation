"use client";

import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { sitesApi } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";

// This is a public-facing invitation page
// It renders the invitation site for a specific subdomain

export default function PublicSitePage() {
  const params = useParams();
  const subdomain = params.subdomain as string;

  const { data: siteData, isLoading } = useQuery({
    queryKey: ["site", subdomain],
    queryFn: () => sitesApi.getBySubdomain(subdomain),
    enabled: !!subdomain,
  });
  
  const site = siteData?.site;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-8">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <div className="flex justify-center gap-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    notFound();
  }

  // Render the site based on its scene graph
  // This is a simplified example - the actual implementation would
  // render the full scene graph from the site data

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="font-semibold text-gray-800">
            {site.name}
          </span>
          <div className="text-sm text-gray-500">
            Powered by EIOS
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-serif text-gray-900 mb-4">
            You&apos;re Invited!
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto">
            Join us for a special celebration
          </p>
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Event Details
            </h2>
            <div className="w-16 h-1 bg-pink-500 mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <Calendar className="w-8 h-8 text-pink-500 mb-3" />
              <span className="font-medium text-gray-900">Date</span>
              <span className="text-gray-600 text-sm mt-1">June 15, 2025</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <Clock className="w-8 h-8 text-pink-500 mb-3" />
              <span className="font-medium text-gray-900">Time</span>
              <span className="text-gray-600 text-sm mt-1">4:00 PM</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl">
              <MapPin className="w-8 h-8 text-pink-500 mb-3" />
              <span className="font-medium text-gray-900">Location</span>
              <span className="text-gray-600 text-sm mt-1">Grand Ballroom</span>
            </div>
          </div>

          {/* RSVP Section */}
          <div className="border-t pt-8">
            <h3 className="text-xl font-semibold text-center mb-6">
              Will you be attending?
            </h3>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <CheckCircle className="mr-2 h-5 w-5" />
                Yes, I&apos;ll be there
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 px-8"
              >
                <XCircle className="mr-2 h-5 w-5" />
                Sorry, can&apos;t make it
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-yellow-200 text-yellow-600 hover:bg-yellow-50 px-8"
              >
                <HelpCircle className="mr-2 h-5 w-5" />
                Maybe
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Dress Code</h3>
            <p className="text-gray-600">
              Semi-formal attire requested. The venue has outdoor spaces, so please
              dress accordingly.
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">Gifts</h3>
            <p className="text-gray-600">
              Your presence is the best present! If you wish to give something,
              we&apos;ve registered at select stores.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>Created with EIOS - Event Invitation OS</p>
          <p className="mt-1">
            Questions? Contact the host at{" "}
            <a href="mailto:host@example.com" className="text-pink-600 hover:underline">
              host@example.com
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
