"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lightbulb, 
  Mail, 
  MessageSquare, 
  Send, 
  CheckCircle,
  Clock,
  Bell,
  ArrowRight,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { showToast } from "@/components/ui/toaster";

export interface FeatureRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
}

export function FeatureRequestDialog({
  open,
  onOpenChange,
  feature,
}: FeatureRequestDialogProps) {
  const [email, setEmail] = useState("");
  const [useCase, setUseCase] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [notifyMe, setNotifyMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      showToast({
        title: "Email required",
        description: "Please enter your email to get notified.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);

    showToast({
      title: "Request submitted!",
      description: `We'll notify you when ${feature} is available.`,
      variant: "success",
    });

    // Reset after delay and close dialog
    setTimeout(() => {
      setIsSubmitted(false);
      setEmail("");
      setUseCase("");
      onOpenChange(false);
    }, 3000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-white text-lg">
                      Feature Request
                    </DialogTitle>
                    <DialogDescription className="text-white/80 text-sm mt-0.5">
                      Help us build what you need
                    </DialogDescription>
                  </div>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Feature Badge */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {feature}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    In development
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email for notifications
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll notify you when this feature launches.
                  </p>
                </div>

                {/* Use Case Field */}
                <div className="space-y-2">
                  <Label htmlFor="useCase" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                    How would you use this? (Optional)
                  </Label>
                  <Textarea
                    id="useCase"
                    placeholder="Tell us about your use case..."
                    value={useCase}
                    onChange={(e) => setUseCase(e.target.value)}
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your feedback helps us prioritize features.
                  </p>
                </div>

                {/* Notify Toggle */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bell className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Get notified on launch</p>
                    <p className="text-xs text-muted-foreground">
                      Be the first to know when this feature is available
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifyMe(!notifyMe)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${
                      notifyMe ? "bg-[#8B6B5D]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifyMe ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#8B6B5D] to-[#D4A574] text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Send className="w-4 h-4 mr-2" />
                        </motion.div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Request
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-10 h-10 text-green-600" />
              </motion.div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                You&apos;re on the list!
              </h3>
              <p className="text-muted-foreground mb-4">
                We&apos;ll notify you at <strong>{email}</strong> when {feature} is ready.
              </p>

              <div className="flex items-center justify-center gap-2 text-sm text-[#8B6B5D]">
                <Bell className="w-4 h-4" />
                <span>You&apos;ll be notified on launch day</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
