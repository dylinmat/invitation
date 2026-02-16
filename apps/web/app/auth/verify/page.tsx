"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth, useRedirectIfAuthenticated } from "@/hooks/useAuth";
import { Calendar, Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

// Separate component that uses useSearchParams to wrap in Suspense
function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verify, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const email = searchParams.get("email");
  const token = searchParams.get("token");

  // Use the safe redirect hook
  useRedirectIfAuthenticated("/dashboard");

  useEffect(() => {
    // Validate parameters
    if (!email || !token) {
      setStatus("error");
      setErrorMessage("Invalid verification link. Please request a new one.");
      return;
    }

    // If already authenticated, don't verify again
    if (isAuthenticated) {
      return;
    }

    // Verify the token
    const verifyToken = async () => {
      try {
        await verify(email, token);
        setStatus("success");
        // Redirect after a short delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to verify. Please try again."
        );
      }
    };

    verifyToken();
  }, [email, token, verify, router, isAuthenticated]);

  return (
    <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to login
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">
              {status === "loading" && "Verifying..."}
              {status === "success" && "Success!"}
              {status === "error" && "Verification Failed"}
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Please wait while we verify your email"}
              {status === "success" && "Redirecting you to the dashboard..."}
              {status === "error" && errorMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {status === "loading" && (
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            )}
            {status === "success" && (
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  You&apos;re being redirected...
                </p>
              </div>
            )}
            {status === "error" && (
              <div className="flex flex-col items-center space-y-4 w-full">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <Link href="/auth/login" className="w-full">
                  <Button className="w-full">Request New Link</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main page component with Suspense wrapper
export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-muted/50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
