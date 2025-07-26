# 🚀 QuietRoom Production Setup Guide

Complete guide for setting up QuietRoom with Supabase and Clerk in production.

## 📋 Prerequisites

- Supabase production project created
- Clerk production project created
- Domain configured for production
- Environment variables ready

## 🔧 Step 1: Supabase Project Setup

### 1.1 Create Supabase Production Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `quietroom-prod` (or your preferred name)
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 1.2 Configure JWT Settings
1. Go to **Authentication > Settings > JWT Settings**
2. Configure the following:
   - **JWT Key URL**: `https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json`
   - **JWT Default Role**: `authenticated`
   - **JWT Issuer**: `https://your-clerk-domain.clerk.accounts.dev`

### 1.3 Enable Third Party Auth
1. Go to **Authentication > Settings > Third Party Auth**
2. Click "Add provider"
3. Select **Clerk**
4. Enter your Clerk domain: `https://your-clerk-domain.clerk.accounts.dev`
5. Click "Enable"

## 🔧 Step 2: Clerk Project Setup

### 2.1 Create Clerk Production Project
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Add application"
3. Enter application details:
   - **Name**: `QuietRoom`
   - **Environment**: Production
4. Click "Create application"

### 2.2 Configure JWT Template
1. Go to **JWT Templates**
2. Click "New template"
3. Configure the template:
   - **Name**: `supabase`
   - **Token lifetime**: `60` seconds
   - **Allowed clock skew**: `5` seconds
   - **Issuer**: `https://your-clerk-domain.clerk.accounts.dev`
   - **JWKS Endpoint**: `https://your-clerk-domain.clerk.accounts.dev/.well-known/jwks.json`
4. Click "Create template"

### 2.3 Configure Domains
1. Go to **Domains**
2. Add your production domain (e.g., `app.yourdomain.com`)
3. Configure DNS settings as instructed
4. Wait for domain verification

## 🔧 Step 3: Database Setup

### 3.1 Run Database Scripts
Execute the following scripts in your Supabase SQL Editor in order:

#### Option A: Standard Setup (if storage extension is available)
```sql
-- Run these scripts in order:
1. scripts/production-setup/1-setup-tables.sql
2. scripts/production-setup/2-setup-storage-buckets.sql
3. scripts/production-setup/3-setup-storage-policies.sql
4. scripts/verification/4-verification.sql
```

#### Option B: Manual Setup (if you encounter storage permission errors)
```sql
-- Run these scripts in order:
1. scripts/production-setup/1-setup-tables.sql
2. scripts/storage/2-manual-storage-setup.sql
3. scripts/storage/3-manual-storage-policies.sql
4. scripts/verification/4-verification.sql
```

#### Option C: Minimal Setup (for very restricted environments)
```sql
-- Run these scripts in order:
1. scripts/production-setup/1-setup-tables.sql
2. scripts/storage/minimal-storage-config.sql
3. scripts/verification/4-verification.sql
```

### 3.2 Schema Alignment (if needed)
If your production schema differs from local:
```sql
-- Run this script to align schemas:
scripts/schema/fix-production-schema.sql
```

### 3.3 Add Missing Components (if needed)
If you're missing triggers or functions:
```sql
-- Run this script to add missing components:
scripts/schema/add-missing-production-components.sql
```

## 🔧 Step 4: Storage Configuration

### 4.1 Make Buckets Public
If your buckets aren't public (required for image display):
```sql
-- Run this script:
scripts/storage/public-buckets-setup.sql
```

### 4.2 Configure Storage Policies
If you need to configure storage policies manually:
```sql
-- Run this script:
scripts/storage/configure-existing-storage.sql
```

## 🔧 Step 5: Environment Variables

### 5.1 Production Environment Variables
Set these in your production environment (Vercel, Netlify, etc.):

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_secret

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key

# Optional: Custom domain
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

### 5.2 Get Your Keys

#### Clerk Keys
1. Go to **API Keys** in Clerk Dashboard
2. Copy the **Publishable Key** and **Secret Key**
3. Make sure you're using the **Live** keys (not test keys)

#### Supabase Keys
1. Go to **Settings > API** in Supabase Dashboard
2. Copy the **Project URL** and **anon public** key
3. Make sure you're using the **production** project keys

## 🔧 Step 6: Deploy Application

### 6.1 Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard
3. Deploy the application

### 6.2 Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set the environment variables in Netlify dashboard
3. Deploy the application

## 🔧 Step 7: Verification

### 7.1 Test Authentication
1. Visit your production URL
2. Try to sign up with a new account
3. Verify you can sign in and out
4. Check that user data is created in Supabase

### 7.2 Test Image Upload
1. Sign in to your application
2. Try to upload an image
3. Verify the image is stored in Supabase Storage
4. Check that the image URL is accessible

### 7.3 Test Database Operations
1. Create a journal entry
2. Verify it appears in the database
3. Check that RLS policies are working (users can only see their own data)

## 🚨 Troubleshooting

### Storage Permission Errors
If you get "permission denied for schema storage":
1. Use the manual storage setup scripts
2. Or configure storage through Supabase UI
3. Contact Supabase support if issues persist

### JWT Authentication Errors
If authentication fails:
1. Verify JWT settings in Supabase
2. Check Clerk JWT template configuration
3. Ensure environment variables are correct

### Image Upload Failures
If image upload fails:
1. Check that buckets are public
2. Verify storage policies are correct
3. Ensure Clerk JWT integration is working

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting scripts in `scripts/storage/`
2. Review the verification scripts in `scripts/verification/`
3. Check Supabase and Clerk logs
4. Contact support if needed

---

**🎉 Congratulations! Your QuietRoom application is now ready for production!**
