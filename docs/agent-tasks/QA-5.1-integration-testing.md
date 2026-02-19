# QA Agent A: Integration Testing
**Task ID:** QA-5.1  
**Priority:** Critical  
**Estimated Time:** 4-6 hours

## Test Scenarios

### 1. Onboarding Flow Tests

#### Couple Path
- [ ] Navigate to /auth/register
- [ ] Complete registration
- [ ] Verify email
- [ ] Select "Personal Event" on onboarding
- [ ] Enter partner names
- [ ] Select event date
- [ ] Click "Create My Event Space"
- [ ] Verify redirect to /dashboard/couple
- [ ] Verify data persisted (refresh page)

#### Professional Path
- [ ] Register as new user
- [ ] Select "Professional" on onboarding
- [ ] Enter business name
- [ ] Select business type
- [ ] Choose plan (Starter/Professional)
- [ ] Verify redirect to /dashboard/business

### 2. Dashboard Data Tests

#### Couple Dashboard
- [ ] Event details load correctly
- [ ] Stats cards show real numbers
- [ ] Checklist items load and toggle
- [ ] Add custom checklist item
- [ ] Recent activity shows
- [ ] Send reminders button works
- [ ] All navigation links work

#### Business Dashboard
- [ ] Analytics load correctly
- [ ] Client list displays
- [ ] Create new event
- [ ] Create new client
- [ ] Invite team member
- [ ] Create invoice
- [ ] Filter clients

### 3. Email Flow Tests
- [ ] Request magic link
- [ ] Click magic link in email
- [ ] Verify resend magic link (with rate limit)
- [ ] Resend verification email

### 4. Social Auth Tests (if implemented)
- [ ] Google Sign In
- [ ] Microsoft Sign In
- [ ] Apple Sign In

## Test Data Setup

Create test accounts:
```sql
-- Test couple user
INSERT INTO users (email, full_name) 
VALUES ('test-couple@example.com', 'Test Couple');

-- Test business user  
INSERT INTO users (email, full_name)
VALUES ('test-business@example.com', 'Test Business');
```

## Automated Tests (Optional)

If using Cypress/Playwright:

```typescript
describe('Onboarding Flow', () => {
  it('completes couple onboarding', () => {
    cy.visit('/auth/register');
    cy.get('[name=email]').type('test@example.com');
    cy.get('button[type=submit]').click();
    // ... complete flow
    cy.url().should('include', '/dashboard/couple');
  });
});
```

## Bug Report Template

```markdown
## Bug: [Brief Description]
**Severity:** [Critical/High/Medium/Low]
**Steps to Reproduce:**
1. 
2. 
3. 

**Expected:** 
**Actual:** 
**Screenshots:** 
**Assignee:** [Agent responsible]
```

## Sign-off Criteria

- [ ] All critical path tests pass
- [ ] No blocking bugs
- [ ] All P0 issues resolved
