# HTTP Status Code Review - Backend API Endpoints

This document reviews all API endpoints and their HTTP status codes to ensure they follow REST best practices.

## REST Status Code Best Practices

### Success Codes
- **200 OK**: Standard success response with data
- **201 Created**: New resource created successfully (return created resource)
- **204 No Content**: Success with no response body (deletion, void operations)

### Client Error Codes
- **400 Bad Request**: Invalid input/validation error
- **401 Unauthorized**: Not authenticated
- **403 Forbidden**: Not authorized (authenticated but no permission)
- **404 Not Found**: Resource doesn't exist

### Server Error Codes
- **500 Internal Server Error**: Unexpected server error

---

## NestJS Defaults

| HTTP Method | Default Status | Override With |
|-------------|----------------|---------------|
| `@Get()` | 200 OK | N/A |
| `@Post()` | **201 Created** | `@HttpCode(HttpStatus.OK)` or `@HttpCode(HttpStatus.CREATED)` |
| `@Put()` | 200 OK | N/A |
| `@Patch()` | 200 OK | N/A |
| `@Delete()` | 200 OK | `@HttpCode(HttpStatus.NO_CONTENT)` |

---

## Endpoint Review by Controller

### ✅ Auth Controller (`auth.controller.ts`)

| Endpoint | Method | Current | Correct | Status |
|----------|--------|---------|---------|--------|
| `/auth/register` | POST | 201 | 201 | ✅ Correct |
| `/auth/login` | POST | 200 | 200 | ✅ Fixed |
| `/auth/refresh` | POST | 200 | 200 | ✅ Correct |
| `/auth/logout` | POST | 200 | 200 | ✅ Correct |
| `/auth/profile` | GET | 200 | 200 | ✅ Correct |

**Notes:**
- `register` → 201 (creates new user)
- `login` → 200 (authenticates, doesn't create)
- `refresh` → 200 (refreshes token, doesn't create)
- `logout` → 200 (invalidates token, returns success)

---

### ⚠️ Transactions Controller (`transactions.controller.ts`)

| Endpoint | Method | Current | Should Be | Fix Needed |
|----------|--------|---------|-----------|------------|
| `POST /transactions` | POST | **201** | **201** | ✅ OK (creates resource) |
| `POST /transactions/purchase` | POST | **201** | **201** | ✅ OK (creates resource) |
| `PUT /transactions/:id` | PUT | 200 | 200 | ✅ OK |
| `DELETE /transactions/:id` | DELETE | 200 | **204** | ⚠️ Should use 204 |
| `GET /transactions` | GET | 200 | 200 | ✅ OK |
| `GET /transactions/summary` | GET | 200 | 200 | ✅ OK |
| `GET /transactions/:id` | GET | 200 | 200 | ✅ OK |

**Recommendation:**
```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)  // Add this
remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  return this.transactionsService.remove(id, user);
}
```

---

### ⚠️ Users Controller (`users.controller.ts`)

| Endpoint | Method | Current | Should Be | Fix Needed |
|----------|--------|---------|-----------|------------|
| `POST /users` | POST | **201** | **201** | ✅ OK (creates user) |
| `PATCH /users/:id` | PATCH | 200 | 200 | ✅ OK |
| `PATCH /users/:id/assign-branch` | PATCH | 200 | 200 | ✅ OK |
| `DELETE /users/:id` | DELETE | 200 | **204** | ⚠️ Should use 204 (soft delete) |
| `PATCH /users/:id/reactivate` | PATCH | 200 | 200 | ✅ OK |
| `GET /users` | GET | 200 | 200 | ✅ OK |
| `GET /users/:id` | GET | 200 | 200 | ✅ OK |

**Note:** DELETE is soft delete (sets isActive=false), but still should return 204 since it's a deletion operation.

**Recommendation:**
```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)  // Add this
@Roles([UserRole.ADMIN])
remove(@Param('id') id: string) {
  return this.usersService.remove(id);
}
```

---

### ⚠️ Branches Controller (`branches.controller.ts`)

| Endpoint | Method | Current | Should Be | Fix Needed |
|----------|--------|---------|-----------|------------|
| `POST /branches` | POST | **201** | **201** | ✅ OK (creates branch) |
| `PUT /branches/:id` | PUT | 200 | 200 | ✅ OK |
| `DELETE /branches/:id` | DELETE | 200 | **204** | ⚠️ Should use 204 |
| `GET /branches` | GET | 200 | 200 | ✅ OK |
| `GET /branches/:id` | GET | 200 | 200 | ✅ OK |

**Recommendation:**
```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)  // Add this
remove(@Param('id') id: string) {
  return this.branchesService.remove(id);
}
```

---

### ⚠️ Debts Controller (`debts.controller.ts`)

| Endpoint | Method | Current | Should Be | Fix Needed |
|----------|--------|---------|-----------|------------|
| `POST /debts` | POST | **201** | **201** | ✅ OK (creates debt) |
| `POST /debts/:id/payments` | POST | **201** | **201** | ✅ OK (creates payment record) |
| `GET /debts` | GET | 200 | 200 | ✅ OK |
| `GET /debts/:id` | GET | 200 | 200 | ✅ OK |

**Notes:**
- No DELETE endpoint (debts aren't deleted, only marked paid)
- Payment creation returns 201 (creates a payment record)

---

### ⚠️ Inventory Controller (`inventory.controller.ts`)

| Endpoint | Method | Current | Should Be | Fix Needed |
|----------|--------|---------|-----------|------------|
| `POST /inventory` | POST | **201** | **201** | ✅ OK (creates item) |
| `PUT /inventory/:id` | PUT | 200 | 200 | ✅ OK |
| `DELETE /inventory/:id` | DELETE | 200 | **204** | ⚠️ Should use 204 |
| `GET /inventory` | GET | 200 | 200 | ✅ OK |
| `GET /inventory/:id` | GET | 200 | 200 | ✅ OK |
| `GET /inventory/value` | GET | 200 | 200 | ✅ OK |

**Recommendation:**
```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)  // Add this
remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
  return this.inventoryService.remove(id, user);
}
```

---

### ⚠️ Notifications Controller (`notifications.controller.ts`)

| Endpoint | Method | Current | Should Be | Fix Needed |
|----------|--------|---------|-----------|------------|
| `PATCH /notifications/:id/read` | PATCH | 200 | 200 | ✅ OK (updates read status) |
| `POST /notifications/settings` | POST | **201** | **200** | ⚠️ Upsert operation |
| `DELETE /notifications/settings/:type` | DELETE | 200 | **204** | ⚠️ Should use 204 |
| `GET /notifications/unread` | GET | 200 | 200 | ✅ OK |
| `GET /notifications/unread/count` | GET | 200 | 200 | ✅ OK |
| `GET /notifications/settings` | GET | 200 | 200 | ✅ OK |

**Notes:**
- `POST /notifications/settings` is an **upsert** (update or create), so it should return 200, not 201

**Recommendations:**
```typescript
@Post('settings')
@HttpCode(HttpStatus.OK)  // Add this (upsert operation)
updateSettings(@CurrentUser() user: RequestUser, @Body() updateDto: UpdateNotificationSettingsDto) {
  return this.notificationSettingsService.updateSettings(user.id, updateDto);
}

@Delete('settings/:notificationType')
@HttpCode(HttpStatus.NO_CONTENT)  // Add this
deleteSetting(@CurrentUser() user: RequestUser, @Param('notificationType') notificationType: string) {
  return this.notificationSettingsService.deleteSetting(user.id, notificationType);
}
```

---

## Summary of Changes Needed

### High Priority (Wrong Status Codes)

1. **Notifications Settings POST** - Change 201 → 200 (upsert operation)
   ```typescript
   @Post('settings')
   @HttpCode(HttpStatus.OK)  // Add this
   ```

### Medium Priority (Best Practice)

2. **All DELETE endpoints** - Change 200 → 204 (RESTful best practice)
   - `DELETE /transactions/:id`
   - `DELETE /users/:id`
   - `DELETE /branches/:id`
   - `DELETE /inventory/:id`
   - `DELETE /notifications/settings/:type`

   ```typescript
   @Delete(':id')
   @HttpCode(HttpStatus.NO_CONTENT)  // Add this
   ```

---

## Implementation Priority

### Phase 1: Critical Fixes (Wrong Status Codes)
- ✅ **Auth login** - Fixed (201 → 200)
- ⚠️ **Notifications settings POST** - Should be 200 (upsert)

### Phase 2: Best Practice (Optional but Recommended)
- All DELETE endpoints → 204 No Content
- Improves RESTful compliance
- Better semantic meaning

---

## Testing After Changes

For each endpoint changed to 204:
1. Verify frontend doesn't expect response body
2. Update frontend to handle 204 responses
3. Test optimistic updates still work

For notification settings POST:
1. Verify it works for both create and update cases
2. Test that 200 is returned instead of 201

---

## Reference: HTTP Status Codes

```
2xx Success
├── 200 OK ..................... Standard success with data
├── 201 Created ................ Resource created
└── 204 No Content ............. Success without response body

4xx Client Errors
├── 400 Bad Request ............ Invalid request
├── 401 Unauthorized ........... Not authenticated
├── 403 Forbidden .............. Not authorized
└── 404 Not Found .............. Resource not found

5xx Server Errors
└── 500 Internal Server Error .. Unexpected error
```
