# Frontend Agent A: Onboarding API Integration
**Task ID:** FRONTEND-2.1  
**Priority:** Critical  
**Estimated Time:** 4-5 hours

## Objective
Replace all mock `setTimeout` calls in the onboarding flow with real API calls.

## Target File
`apps/web/app/onboarding/page.tsx`

## Current State (What to Fix)

### Issue 1: Line 105-106 - handleDetailsSubmit
**Current Code:**
```typescript
const handleDetailsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  try {
    // TODO: Call API to update user organization type
    await new Promise((resolve) => setTimeout(resolve, 1000)); // MOCK!
    // ... redirect
  }
};
```

**Required Change:**
Replace with actual API call to `POST /api/users/onboarding`

### Issue 2: Line 135-136 - handlePlanSelect  
**Current Code:**
```typescript
const handlePlanSelect = async () => {
  setIsLoading(true);
  try {
    // TODO: Call API to set plan
    await new Promise((resolve) => setTimeout(resolve, 1000)); // MOCK!
    // ... redirect
  }
};
```

**Required Change:**
Replace with actual API call to `PUT /api/users/plan`

## Implementation Steps

### Step 1: Add API Methods to lib/api.ts

Add these methods to `apps/web/lib/api.ts`:

```typescript
// User onboarding
export const userApi = {
  completeOnboarding: (data: {
    type: "COUPLE" | "PLANNER" | "VENUE";
    coupleNames?: { partner1: string; partner2: string };
    eventDate?: string;
    businessName?: string;
    website?: string;
    businessType?: "PLANNER" | "VENUE" | "VENDOR";
  }) => api.post("/users/onboarding", data),

  updatePlan: (plan: "FREE" | "STARTER" | "PROFESSIONAL") => 
    api.put("/users/plan", { plan }),

  getOrganization: () => api.get("/users/me/organization"),
};
```

### Step 2: Replace handleDetailsSubmit

```typescript
const handleDetailsSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const payload: any = { type: userType };

    if (userType === "COUPLE") {
      payload.coupleNames = coupleNames;
      payload.eventDate = eventDate || undefined;
    } else {
      payload.businessName = businessName;
      payload.website = website || undefined;
      payload.businessType = userType; // PLANNER or VENUE
    }

    await userApi.completeOnboarding(payload);
    
    // Refresh user data in auth context
    await refreshUser();

    if (userType === "COUPLE") {
      showToast({
        title: "Welcome! 🎉",
        description: "Your event space is ready!",
        variant: "success",
      });
      router.push("/dashboard/couple");
    } else {
      setStep("plan");
    }
  } catch (error) {
    console.error("Onboarding error:", error);
    showToast({
      title: "Failed to save",
      description: "Please try again or contact support.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
```

### Step 3: Replace handlePlanSelect

```typescript
const handlePlanSelect = async () => {
  setIsLoading(true);

  try {
    await userApi.updatePlan(selectedPlan as "FREE" | "STARTER" | "PROFESSIONAL");

    showToast({
      title: "Welcome to EIOS Pro!",
      description: "Your 14-day trial starts now.",
      variant: "success",
    });

    router.push("/dashboard/business");
  } catch (error) {
    console.error("Plan selection error:", error);
    showToast({
      title: "Failed to set plan",
      description: "Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsLoading(false);
  }
};
```

### Step 4: Add Error UI States

Add visual error states to the forms:

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

// Validate before submit
const validateDetails = () => {
  const newErrors: Record<string, string> = {};
  
  if (userType === "COUPLE") {
    if (!coupleNames.partner1.trim()) newErrors.partner1 = "Required";
    if (!coupleNames.partner2.trim()) newErrors.partner2 = "Required";
  } else {
    if (!businessName.trim()) newErrors.businessName = "Business name required";
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Step 5: Add Loading States

Ensure all buttons show loading state:

```typescript
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Setting up...
    </>
  ) : (
    "Continue"
  )}
</Button>
```

## Testing Checklist

- [ ] Couple onboarding flow saves partner names
- [ ] Couple onboarding saves event date (optional)
- [ ] Professional onboarding saves business name
- [ ] Professional flow shows plan selection after details
- [ ] Plan selection saves to backend
- [ ] Error states show when API fails
- [ ] Loading states prevent double-submit
- [ ] Success toasts appear
- [ ] Redirects work correctly

## API Contract (from Backend Agent)

Expected endpoints (coordinate with Backend Agent A):
- `POST /api/users/onboarding` - Saves user type and details
- `PUT /api/users/plan` - Updates subscription plan

If endpoints differ, update this document.

## Dependencies

- Backend Agent A must complete `BACKEND-1.1` first
- Need `refreshUser()` function from auth context (check if exists)
