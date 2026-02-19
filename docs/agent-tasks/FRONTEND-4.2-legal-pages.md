# Content Agent: Legal Pages
**Task ID:** FRONTEND-4.2  
**Priority:** Low  
**Estimated Time:** 2-3 hours

## Objective
Create Terms of Service and Privacy Policy pages, replacing "Coming soon" placeholders.

## Pages to Create

### 1. Terms of Service
File: `apps/web/app/legal/terms/page.tsx`

**Structure:**
- Header with EIOS branding
- Last updated date
- Sections:
  1. Acceptance of Terms
  2. Description of Service
  3. User Accounts
  4. Acceptable Use
  5. Payment Terms (if applicable)
  6. Termination
  7. Disclaimer of Warranties
  8. Limitation of Liability
  9. Governing Law
  10. Changes to Terms
  11. Contact Information

### 2. Privacy Policy
File: `apps/web/app/legal/privacy/page.tsx`

**Sections:**
  1. Introduction
  2. Information We Collect
  3. How We Use Information
  4. Information Sharing
  5. Data Security
  6. Your Rights (GDPR/CCPA)
  7. Cookies
  8. Third-Party Services
  9. Children's Privacy
  10. Changes to Policy
  11. Contact Us

## Update Links

### In `apps/web/app/auth/login/page.tsx`:

**Current:**
```typescript
<Link href="#" onClick={(e) => {
  e.preventDefault();
  showToast({ title: "Coming soon" });
}}>
```

**Replace with:**
```typescript
<Link href="/legal/terms" target="_blank">Terms of Service</Link>
<Link href="/legal/privacy" target="_blank">Privacy Policy</Link>
```

### In `apps/web/app/auth/register/page.tsx`:

Make same replacements for terms and privacy links.

## Styling

Use consistent legal page styling:

```typescript
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-[#8B6B5D] to-[#D4A574] rounded-lg" />
            <span className="font-bold">EIOS</span>
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground mt-2">Last updated: February 2025</p>
        </div>
        
        {/* Content */}
        <div className="prose prose-slate max-w-none">
          {/* Sections here */}
        </div>
        
        {/* Footer */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Questions? Contact us at support@eios.app
          </p>
        </div>
      </div>
    </div>
  );
}
```

## Content Guidelines

- Use clear, simple language
- Avoid legal jargon where possible
- Include specific examples
- Make it scannable (use headings, bullet points)
- Ensure GDPR/CCPA compliance sections

## Testing

- Pages should render correctly
- Links from login/register should work
- Should open in new tab
- Mobile responsive
