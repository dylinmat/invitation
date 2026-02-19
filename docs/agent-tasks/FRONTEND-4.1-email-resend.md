# Frontend Agent D: Email Resend & Utilities
**Task ID:** FRONTEND-4.1  
**Priority:** Medium  
**Estimated Time:** 2-3 hours

## Objective
Replace mock email resend functions with real API calls.

## Files to Modify

### 1. `apps/web/app/auth/login/page.tsx`

**Current Issue (Line 522-531):**
```typescript
onClick={() => {
  setIsLoading(true);
  setTimeout(() => {  // MOCK!
    setIsLoading(false);
    showToast({...});
  }, 1000);
}}
```

**Replace with:**
```typescript
import { authApi } from "@/lib/api";

const handleResendMagicLink = async () => {
  setIsResending(true);
  try {
    await authApi.resendMagicLink(email);
    showToast({
      title: "Link resent",
      description: "Check your email for the new magic link.",
      variant: "success",
    });
    // Disable button for 60 seconds
    setResendDisabled(true);
    setTimeout(() => setResendDisabled(false), 60000);
  } catch (error) {
    showToast({
      title: "Failed to resend",
      description: "Please try again in a moment.",
      variant: "destructive",
    });
  } finally {
    setIsResending(false);
  }
};

// In JSX:
<Button
  variant="ghost"
  onClick={handleResendMagicLink}
  disabled={isResending || resendDisabled}
>
  {isResending ? <Loader2 className="animate-spin" /> : "Resend magic link"}
</Button>
```

### 2. `apps/web/app/auth/register/page.tsx`

**Current Issue (Line 535-544):** Same mock pattern

**Replace with similar implementation** calling `authApi.resendVerification(email)`

### 3. Add API Methods

File: `apps/web/lib/api.ts`

```typescript
export const authApi = {
  // ... existing methods
  
  resendMagicLink: (email: string) =>
    api.post("/auth/resend-magic-link", { email }),
    
  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),
};
```

## State Management

Add to login/register components:

```typescript
const [isResending, setIsResending] = useState(false);
const [resendDisabled, setResendDisabled] = useState(false);
```

## Rate Limiting UI

Show countdown when button is disabled:

```typescript
const [countdown, setCountdown] = useState(60);

useEffect(() => {
  if (resendDisabled) {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          setResendDisabled(false);
          return 60;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }
}, [resendDisabled]);

// In button:
{resendDisabled ? `Resend in ${countdown}s` : "Resend magic link"}
```

## Testing

- Click resend button
- Should call API
- Button should disable for 60s
- Toast should confirm
- Should handle API errors gracefully
