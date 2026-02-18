"use client";

/**
 * Invite Member Dialog
 * Modal for inviting new team members
 */

import React, { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { Role, Permission, RoleDisplayNames, isValidEmail } from "@/lib/permissions";
import { useTeamPermissions } from "@/components/permissions/use-permissions";
import { RoleAssign } from "./role-select";
import { cn } from "@/lib/utils";

// ============================================
// Types
// ============================================

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface InviteFormData {
  emails: string[];
  role: Role;
  message: string;
}

interface EmailValidation {
  email: string;
  isValid: boolean;
  error?: string;
}

// ============================================
// Mock API
// ============================================

const sendInvites = async (data: InviteFormData): Promise<{ sent: number; failed: number }> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1500));
  return { sent: data.emails.length, failed: 0 };
};

// ============================================
// Email Input Component
// ============================================

function EmailInput({
  emails,
  onChange,
  disabled = false,
}: {
  emails: string[];
  onChange: (emails: string[]) => void;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState("");
  const [validations, setValidations] = useState<EmailValidation[]>([]);

  const validateEmail = (email: string): EmailValidation => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      return { email: trimmed, isValid: false, error: "Email is required" };
    }
    if (!isValidEmail(trimmed)) {
      return { email: trimmed, isValid: false, error: "Invalid email format" };
    }
    if (emails.includes(trimmed)) {
      return { email: trimmed, isValid: false, error: "Email already added" };
    }
    return { email: trimmed, isValid: true };
  };

  const addEmail = (email: string) => {
    const validation = validateEmail(email);
    
    if (!validation.isValid) {
      setValidations((prev) => [...prev, validation]);
      setTimeout(() => {
        setValidations((prev) => prev.filter((v) => v.email !== validation.email));
      }, 3000);
      return;
    }

    onChange([...emails, validation.email]);
    setInputValue("");
  };

  const removeEmail = (emailToRemove: string) => {
    onChange(emails.filter((e) => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    }
    if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text");
    const pastedEmails = pastedText.split(/[,\n\s]+/).filter(Boolean);
    
    pastedEmails.forEach((email) => {
      addEmail(email);
    });
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Email Addresses
        <span className="text-gray-400 font-normal ml-1">
          (Press Enter or comma to add multiple)
        </span>
      </label>
      
      <div
        className={cn(
          "min-h-[100px] p-3 border rounded-lg bg-white transition-colors",
          disabled ? "bg-gray-50 border-gray-200" : "border-gray-300 hover:border-gray-400 focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500"
        )}
      >
        <div className="flex flex-wrap gap-2">
          {emails.map((email) => (
            <span
              key={email}
              className="inline-flex items-center gap-1 px-2 py-1 bg-rose-50 text-rose-700 text-sm rounded-md"
            >
              {email}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeEmail(email)}
                  className="p-0.5 hover:bg-rose-100 rounded"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={disabled}
            placeholder={emails.length === 0 ? "Enter email addresses..." : ""}
            className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
          />
        </div>
      </div>

      {/* Validation Errors */}
      {validations.length > 0 && (
        <div className="space-y-1">
          {validations.map((validation) => (
            <p key={validation.email} className="text-sm text-red-600">
              {validation.email}: {validation.error}
            </p>
          ))}
        </div>
      )}

      {/* Hint */}
      <p className="text-xs text-gray-500">
        You can paste multiple emails separated by commas, spaces, or new lines
      </p>
    </div>
  );
}

// ============================================
// Success View
// ============================================

function InviteSuccess({
  count,
  role,
  onClose,
  onInviteMore,
}: {
  count: number;
  role: Role;
  onClose: () => void;
  onInviteMore: () => void;
}) {
  return (
    <div className="text-center py-8">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        {count} invitation{count !== 1 ? "s" : ""} sent!
      </h3>
      <p className="text-gray-500 mt-1">
        Invited as <span className="font-medium text-gray-700">{RoleDisplayNames[role]}</span>
      </p>
      <p className="text-sm text-gray-400 mt-4">
        Invitations expire in 7 days
      </p>
      <div className="flex justify-center gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Done
        </button>
        <button
          onClick={onInviteMore}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
        >
          Invite More
        </button>
      </div>
    </div>
  );
}

// ============================================
// Main Dialog Component
// ============================================

export function InviteMemberDialog({ isOpen, onClose }: InviteMemberDialogProps) {
  const [emails, setEmails] = useState<string[]>([]);
  const [role, setRole] = useState<Role>(Role.MEMBER);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [successCount, setSuccessCount] = useState(0);

  const teamPermissions = useTeamPermissions();

  const inviteMutation = useMutation({
    mutationFn: sendInvites,
    onSuccess: (result) => {
      setSuccessCount(result.sent);
      setStep("success");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emails.length === 0) return;

    inviteMutation.mutate({
      emails,
      role,
      message: message.trim() || undefined,
    });
  };

  const handleClose = useCallback(() => {
    setEmails([]);
    setRole(Role.MEMBER);
    setMessage("");
    setStep("form");
    inviteMutation.reset();
    onClose();
  }, [onClose, inviteMutation]);

  const handleInviteMore = () => {
    setEmails([]);
    setRole(Role.MEMBER);
    setMessage("");
    setStep("form");
    inviteMutation.reset();
  };

  if (!isOpen) return null;

  // Check if user can invite members
  if (!teamPermissions.canViewTeam) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Access Denied</h3>
            <p className="text-gray-500 mt-1">
              You don&apos;t have permission to invite team members.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {step === "form" ? "Invite Team Members" : "Invitations Sent"}
            </h2>
            {step === "form" && (
              <p className="text-sm text-gray-500">
                Add people to your organization
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          {step === "success" ? (
            <InviteSuccess
              count={successCount}
              role={role}
              onClose={handleClose}
              onInviteMore={handleInviteMore}
            />
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Email Input */}
              <EmailInput
                emails={emails}
                onChange={setEmails}
                disabled={inviteMutation.isPending}
              />

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assign Role
                </label>
                <RoleAssign
                  value={role}
                  onChange={setRole}
                  defaultRole={Role.MEMBER}
                />
              </div>

              {/* Personal Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={inviteMutation.isPending}
                  rows={3}
                  placeholder="Add a personal note to the invitation email..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        {step === "form" && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">
              {emails.length > 0 && (
                <span>
                  {emails.length} recipient{emails.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                disabled={inviteMutation.isPending}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={emails.length === 0 || inviteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white font-medium rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send Invites
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteMemberDialog;
