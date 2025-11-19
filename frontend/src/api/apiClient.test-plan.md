# API Client 401 Handling - Manual Test Plan

## Test Environment Setup

### Prerequisites
- Application running in development mode (`npm run dev`)
- Backend API running and accessible
- Browser DevTools open (Console + Network tabs)
- Access to browser localStorage/sessionStorage

### Test User Account
- Have a valid test user account
- Know the credentials for login

---

## Test Case 1: Successful Token Refresh

**Objective**: Verify that expired access tokens are automatically refreshed

**Priority**: HIGH

**Steps**:

1. **Login to the application**
   - Navigate to `/login`
   - Enter valid credentials
   - Click "تسجيل الدخول"
   - Verify successful login

2. **Check auth storage**
   - Open DevTools → Application → Storage
   - Check localStorage or sessionStorage for `auth-storage`
   - Note the access token and refresh token

3. **Manually expire the access token**
   - In DevTools Console, run:
   ```javascript
   // Get current auth storage
   const storage = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
   const parsed = JSON.parse(storage);

   // Set access token to an expired one (or invalid)
   parsed.state.userToken.accessToken = 'expired_token_12345';

   // Save back
   if (localStorage.getItem('auth-storage')) {
     localStorage.setItem('auth-storage', JSON.stringify(parsed));
   } else {
     sessionStorage.setItem('auth-storage', JSON.stringify(parsed));
   }

   console.log('Access token expired');
   ```

4. **Make an API request**
   - Navigate to `/users` or any protected route
   - Monitor Network tab

5. **Verify token refresh**
   - ✅ First request fails with 401
   - ✅ Second request to `/auth/refresh` is made
   - ✅ Refresh succeeds with 200
   - ✅ Original request is retried with new token
   - ✅ Page loads successfully
   - ✅ New access token is saved in storage
   - ✅ **No** redirect to login
   - ✅ **No** error toast appears

**Expected Result**: ✅ PASS - Page loads successfully without user noticing any error

---

## Test Case 2: Refresh Token Expired (Session Timeout)

**Objective**: Verify proper handling when both tokens are expired

**Priority**: HIGH

**Steps**:

1. **Login to the application**
   - Navigate to `/login`
   - Enter valid credentials
   - Verify successful login

2. **Manually expire BOTH tokens**
   - In DevTools Console, run:
   ```javascript
   // Get current auth storage
   const storage = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
   const parsed = JSON.parse(storage);

   // Set both tokens to expired/invalid
   parsed.state.userToken.accessToken = 'expired_access_token';
   parsed.state.userToken.refreshToken = 'expired_refresh_token';

   // Save back
   if (localStorage.getItem('auth-storage')) {
     localStorage.setItem('auth-storage', JSON.stringify(parsed));
   } else {
     sessionStorage.setItem('auth-storage', JSON.stringify(parsed));
   }

   console.log('Both tokens expired');
   ```

3. **Make an API request**
   - Navigate to `/users` or any protected route
   - Monitor Network tab and Console

4. **Verify logout flow**
   - ✅ First request fails with 401
   - ✅ Refresh request to `/auth/refresh` is made
   - ✅ Refresh fails with 401 or 403
   - ✅ Auth data is cleared from localStorage (check Application tab)
   - ✅ Auth data is cleared from sessionStorage (check Application tab)
   - ✅ Browser redirects to `/login` page
   - ✅ Toast message appears: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى"
   - ✅ User is logged out

**Expected Result**: ✅ PASS - User is redirected to login with Arabic message

---

## Test Case 3: Multiple Simultaneous 401 Errors

**Objective**: Verify that only ONE token refresh is attempted when multiple requests fail simultaneously

**Priority**: MEDIUM

**Steps**:

1. **Login to the application**

2. **Manually expire access token** (use script from Test Case 1)

3. **Navigate to Dashboard or page with multiple API calls**
   - Dashboard typically loads: users, branches, transactions, etc.
   - Monitor Network tab closely

4. **Verify single refresh**
   - ✅ Multiple requests fail with 401 (users, branches, etc.)
   - ✅ Only **ONE** request to `/auth/refresh` is made (not multiple)
   - ✅ After refresh succeeds, all original requests are retried
   - ✅ All data loads successfully
   - ✅ No duplicate refresh requests

**Expected Result**: ✅ PASS - Only one refresh request, all data loads

---

## Test Case 4: Network Error During Token Refresh

**Objective**: Verify proper handling when network fails during refresh

**Priority**: MEDIUM

**Steps**:

1. **Login to the application**

2. **Manually expire access token**

3. **Simulate network failure**
   - Open DevTools → Network tab
   - Enable "Offline" mode (checkbox at top)
   OR
   - Use Network throttling → "Offline"

4. **Make an API request**
   - Try to navigate to `/users`

5. **Verify logout flow**
   - ✅ Request fails (network error)
   - ✅ Auth data is cleared
   - ✅ Redirect to `/login`
   - ✅ Toast message appears

6. **Re-enable network**
   - Disable "Offline" mode
   - Verify you can login again

**Expected Result**: ✅ PASS - User is logged out with error message

---

## Test Case 5: Server Error During Token Refresh (500)

**Objective**: Verify proper handling when refresh endpoint returns server error

**Priority**: LOW

**Steps**:

1. **Login to the application**

2. **Configure backend to return 500 on /auth/refresh**
   - OR use browser DevTools to block the refresh endpoint:
   ```javascript
   // In Console, before expiring token
   // This will prevent refresh from succeeding
   const originalFetch = window.fetch;
   window.fetch = function(...args) {
     if (args[0].includes('/auth/refresh')) {
       return Promise.reject(new Error('Server error'));
     }
     return originalFetch.apply(this, args);
   };
   ```

3. **Manually expire access token**

4. **Make an API request**

5. **Verify logout flow**
   - ✅ Request fails with 401
   - ✅ Refresh is attempted
   - ✅ Refresh fails (500 or error)
   - ✅ Auth data is cleared
   - ✅ Redirect to `/login`
   - ✅ Toast message appears

**Expected Result**: ✅ PASS - User is logged out when refresh fails

---

## Test Case 6: Verify Auth Storage Cleanup

**Objective**: Ensure both localStorage and sessionStorage are cleared on logout

**Priority**: HIGH

**Steps**:

1. **Login to the application**

2. **Check storage before logout**
   - DevTools → Application → Storage
   - Verify `auth-storage` exists in localStorage OR sessionStorage

3. **Trigger logout** (use Test Case 2 steps)

4. **Check storage after logout**
   - ✅ `auth-storage` is **removed** from localStorage
   - ✅ `auth-storage` is **removed** from sessionStorage
   - ✅ Both storages are cleaned

**Expected Result**: ✅ PASS - All auth data is cleared

---

## Test Case 7: Verify Correct Toast Message (Arabic)

**Objective**: Verify the exact Arabic message is displayed

**Priority**: MEDIUM

**Steps**:

1. **Trigger session timeout** (use Test Case 2)

2. **Verify toast message**
   - ✅ Toast appears in bottom-right corner (Sonner default)
   - ✅ Message is: "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى"
   - ✅ Toast has error styling (red/destructive)
   - ✅ Toast is in Arabic with RTL support

**Expected Result**: ✅ PASS - Correct Arabic message appears

---

## Test Case 8: Verify Redirect to Login

**Objective**: Ensure redirect works correctly

**Priority**: HIGH

**Steps**:

1. **Start on any protected page** (e.g., `/users`)

2. **Trigger session timeout**

3. **Verify redirect**
   - ✅ Browser URL changes to `/login`
   - ✅ Login page is displayed
   - ✅ No infinite redirect loops
   - ✅ Full page reload occurs (not React Router navigation)

4. **Login again**
   - ✅ Can login successfully
   - ✅ Can navigate to protected pages

**Expected Result**: ✅ PASS - Redirect works, can login again

---

## Test Case 9: Remember Me vs Session Storage

**Objective**: Verify token refresh works with both storage types

**Priority**: LOW

**Steps**:

### Part A: localStorage (Remember Me = true)

1. **Login with "تذكرني" checked**
2. **Verify tokens in localStorage**
3. **Test token refresh** (use Test Case 1)
4. ✅ Refresh works correctly

### Part B: sessionStorage (Remember Me = false)

1. **Logout and login WITHOUT "تذكرني" checked**
2. **Verify tokens in sessionStorage**
3. **Test token refresh** (use Test Case 1)
4. ✅ Refresh works correctly

**Expected Result**: ✅ PASS - Refresh works for both storage types

---

## Test Case 10: Token Refresh During Form Submission

**Objective**: Verify refresh doesn't interrupt user actions

**Priority**: MEDIUM

**Steps**:

1. **Login and navigate to create user form** (`/users/create`)

2. **Fill out the form completely** (don't submit yet)

3. **Expire access token** (Console script from Test Case 1)

4. **Submit the form**

5. **Verify behavior**
   - ✅ Form submission triggers API call
   - ✅ 401 is received
   - ✅ Token refresh happens
   - ✅ Form submission is retried automatically
   - ✅ User is created successfully
   - ✅ No data loss
   - ✅ User doesn't notice the refresh

**Expected Result**: ✅ PASS - Form submits successfully after auto-refresh

---

## Quick Test Script (DevTools Console)

Copy and paste this into browser console for quick testing:

```javascript
// ============================================
// QUICK TEST: Expire Access Token
// ============================================
function expireAccessToken() {
  const storageKey = 'auth-storage';
  const storage = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);

  if (!storage) {
    console.error('❌ No auth storage found. Please login first.');
    return;
  }

  const parsed = JSON.parse(storage);
  parsed.state.userToken.accessToken = 'expired_token_' + Date.now();

  if (localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, JSON.stringify(parsed));
  } else {
    sessionStorage.setItem(storageKey, JSON.stringify(parsed));
  }

  console.log('✅ Access token expired. Navigate to any page to trigger refresh.');
}

// ============================================
// QUICK TEST: Expire BOTH Tokens
// ============================================
function expireBothTokens() {
  const storageKey = 'auth-storage';
  const storage = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);

  if (!storage) {
    console.error('❌ No auth storage found. Please login first.');
    return;
  }

  const parsed = JSON.parse(storage);
  parsed.state.userToken.accessToken = 'expired_access_' + Date.now();
  parsed.state.userToken.refreshToken = 'expired_refresh_' + Date.now();

  if (localStorage.getItem(storageKey)) {
    localStorage.setItem(storageKey, JSON.stringify(parsed));
  } else {
    sessionStorage.setItem(storageKey, JSON.stringify(parsed));
  }

  console.log('✅ Both tokens expired. Navigate to any page to trigger logout.');
}

// ============================================
// QUICK TEST: Check Auth Storage
// ============================================
function checkAuthStorage() {
  const local = localStorage.getItem('auth-storage');
  const session = sessionStorage.getItem('auth-storage');

  console.log('=== AUTH STORAGE STATUS ===');
  console.log('localStorage:', local ? '✅ EXISTS' : '❌ EMPTY');
  console.log('sessionStorage:', session ? '✅ EXISTS' : '❌ EMPTY');

  if (local) {
    const parsed = JSON.parse(local);
    console.log('\nTokens in localStorage:');
    console.log('- Access Token:', parsed.state?.userToken?.accessToken?.substring(0, 20) + '...');
    console.log('- Refresh Token:', parsed.state?.userToken?.refreshToken?.substring(0, 20) + '...');
  }

  if (session) {
    const parsed = JSON.parse(session);
    console.log('\nTokens in sessionStorage:');
    console.log('- Access Token:', parsed.state?.userToken?.accessToken?.substring(0, 20) + '...');
    console.log('- Refresh Token:', parsed.state?.userToken?.refreshToken?.substring(0, 20) + '...');
  }
}

// Usage:
// 1. expireAccessToken() - Test successful refresh
// 2. expireBothTokens() - Test logout flow
// 3. checkAuthStorage() - Check current auth state

console.log(`
🧪 Auth Testing Functions Loaded:
- expireAccessToken()  → Test token refresh
- expireBothTokens()   → Test logout flow
- checkAuthStorage()   → Check current state
`);
```

---

## Test Results Template

Use this template to record test results:

```markdown
# 401 Handling Test Results

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Development/Staging/Production]
**Browser**: [Chrome/Firefox/Safari/Edge]

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Successful Token Refresh | ⬜ PASS / ⬜ FAIL | |
| 2. Refresh Token Expired | ⬜ PASS / ⬜ FAIL | |
| 3. Multiple Simultaneous 401s | ⬜ PASS / ⬜ FAIL | |
| 4. Network Error During Refresh | ⬜ PASS / ⬜ FAIL | |
| 5. Server Error During Refresh | ⬜ PASS / ⬜ FAIL | |
| 6. Auth Storage Cleanup | ⬜ PASS / ⬜ FAIL | |
| 7. Correct Toast Message | ⬜ PASS / ⬜ FAIL | |
| 8. Redirect to Login | ⬜ PASS / ⬜ FAIL | |
| 9. Remember Me vs Session | ⬜ PASS / ⬜ FAIL | |
| 10. Token Refresh During Form | ⬜ PASS / ⬜ FAIL | |

**Overall Result**: ⬜ ALL PASS / ⬜ SOME FAILURES

**Issues Found**:
1. [Description]
2. [Description]

**Additional Notes**:
[Any observations]
```

---

## Common Issues During Testing

### Issue: "Auth storage not found"
**Solution**: Make sure you're logged in first

### Issue: Refresh actually succeeds
**Solution**: Make sure backend token validation is working. Use truly expired/invalid tokens.

### Issue: Toast doesn't appear
**Solution**: Check browser console for errors. Ensure Sonner toast provider is mounted.

### Issue: Redirect doesn't work
**Solution**: Check browser console. Verify no JavaScript errors blocking execution.

### Issue: Storage not cleared
**Solution**: Check both localStorage AND sessionStorage. Refresh DevTools if needed.

---

## Automated Testing (Future)

When setting up automated tests (Vitest/Jest):

```typescript
// Example test structure
describe('API Client 401 Handling', () => {
  it('should refresh token on 401', async () => {
    // Mock API responses
    // Trigger 401
    // Verify refresh called
    // Verify request retried
  });

  it('should logout on refresh failure', async () => {
    // Mock refresh failure
    // Verify storage cleared
    // Verify redirect
    // Verify toast shown
  });

  // ... more tests
});
```

---

## Conclusion

✅ All test cases should **PASS** with the current implementation in `apiClient.ts`.

If any test fails, check:
1. Backend API is running correctly
2. Tokens are truly expired (not just modified)
3. Network tab for actual responses
4. Console for any JavaScript errors
5. `apiClient.ts` implementation matches documentation
