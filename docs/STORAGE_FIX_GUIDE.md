# Supabase Storage Bucket Access Fix Guide

## Problem Summary

Your "Found 0 buckets" issue is caused by missing Row Level Security (RLS) policies on the `storage.buckets` table. Regular authenticated users cannot list buckets without proper RLS policies, even if they can access individual bucket contents.

## Root Causes

1. **Missing RLS policies for `storage.buckets` table** - This prevents users from listing available buckets
2. **Inconsistent folder structure in storage policies** - Different buckets use different path structures
3. **No debug information** - Hard to diagnose what's actually failing

## 🛠️ Solution Steps

### Step 1: Apply Fixed Storage Policies

Execute the SQL script I created in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run the contents of `scripts/fix-storage-bucket-access.sql`

This script will:
- ✅ Enable RLS on `storage.buckets` table
- ✅ Add policies to allow authenticated users to see your buckets
- ✅ Fix inconsistent `storage.objects` policies
- ✅ Ensure consistent folder structure (`userId/filename`)

### Step 2: Test with Enhanced Debugging

I've updated your test storage page with comprehensive debugging. Run the test again at `/test-storage` and you'll now see:

- 🔑 JWT token validation and payload inspection
- 📦 Bucket listing capabilities 
- 🧪 Individual bucket access tests (list, upload, delete)
- 💡 Specific recommendations based on what's failing

### Step 3: Verify Bucket Existence

Ensure your buckets exist in the Supabase dashboard:

1. Go to **Storage** in your Supabase dashboard
2. Verify these buckets exist:
   - `journal-entries` (private)
   - `thumbnails` (public)
   - `quietroom` (optional)

If they don't exist, create them manually or run your setup script.

### Step 4: Update Folder Structure (If Needed)

I've standardized all policies to use this folder structure:
```
journal-entries/
  ├── user123/
  │   ├── image1.jpg
  │   └── image2.png
  └── user456/
      └── image3.webp

thumbnails/
  ├── user123/
  │   ├── thumb1.jpg
  │   └── thumb2.png
  └── user456/
      └── thumb3.webp
```

Make sure your upload functions use this structure: `${userId}/filename`

## 🔍 Understanding the "Found 0 buckets" Issue

This is **normal behavior** for non-admin users in Supabase Storage. The `listBuckets()` operation requires admin privileges by default. However, with proper RLS policies:

- ✅ Users can see buckets they have access to
- ✅ Users can perform operations on individual buckets
- ✅ Your app will work correctly even if `listBuckets()` returns 0

## 🧪 Using the New Debug Tool

The enhanced test page now includes:

```typescript
// Comprehensive debugging
const debugInfo = await debugStorageAccess(supabase, user?.id);
const report = formatStorageDebugInfo(debugInfo);
```

This will show you exactly:
- Whether your JWT is valid and contains the right claims
- Which buckets you can access
- What specific errors are occurring
- Actionable next steps

## 🔧 Manual Policy Verification

After applying the SQL script, verify your policies:

```sql
-- Check RLS is enabled on storage.buckets
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'buckets' AND schemaname = 'storage';

-- List policies on storage.buckets
SELECT * FROM pg_policies 
WHERE tablename = 'buckets' AND schemaname = 'storage';

-- List policies on storage.objects
SELECT * FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
```

## 🎯 Expected Results After Fix

After applying these fixes, you should see:

1. **Test page shows**:
   - ✅ Valid JWT with correct claims
   - ✅ Can access individual buckets
   - ✅ Successful upload/download operations

2. **Your app will**:
   - ✅ Work with individual bucket operations
   - ✅ Upload images successfully
   - ✅ Apply proper access controls

3. **Bucket listing may still show 0** - this is normal and expected for non-admin users

## 🚨 Important Notes

- **Don't rely on `listBuckets()`** in your production app - access buckets directly by name
- **Test individual bucket operations** rather than bucket listing
- **Use the debug tool** to diagnose any future storage issues
- **Folder structure must match your policies** - ensure consistency

## 🔄 If Issues Persist

1. Check the debug output from the enhanced test page
2. Verify your Clerk JWT template includes the `sub` claim
3. Ensure your `public.clerk_user_id()` function returns the correct user ID
4. Check that buckets actually exist in your Supabase dashboard

Run the test again after applying the SQL script, and the debug output will tell you exactly what's still failing. 