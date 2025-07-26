# 🚀 QuietRoom Deployment Guide

This guide will walk you through setting up authentication with Clerk and deploying your QuietRoom app to Vercel.

## 🔐 Setting Up Clerk Authentication

### Step 1: Create a Clerk Account

1. Go to [clerk.com](https://clerk.com) and sign up for a free account
2. After signing up, click "Add Application"
3. Name your application (e.g., "QuietRoom")
4. Select "Next.js" as your framework
5. Choose the authentication methods you want to enable (Email/Password is recommended for MVP)

### Step 2: Configure Your Application

1. In your Clerk Dashboard, go to the "API Keys" section
2. You will see two important keys:
   - **Publishable Key**: Starts with `pk_test_` or `pk_live_`
   - **Secret Key**: Starts with `sk_test_` or `sk_live_`

### Step 3: Add Environment Variables Locally

1. Create a `.env.local` file in your project root (if not already created)
2. Add the following environment variables:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key_here
CLERK_SECRET_KEY=your_secret_key_here
```

3. Replace the placeholder values with your actual Clerk API keys

### Step 4: Test Locally

1. Run `npm run dev` to start your development server
2. Open your browser and navigate to `http://localhost:3000`
3. Test the sign-up and sign-in functionality

## 🌐 Deploying to Vercel

### Step 1: Push Your Code to GitHub

1. Create a new GitHub repository
2. Initialize your local repository (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
3. Connect your local repository to GitHub:
   ```bash
   git remote add origin https://github.com/yourusername/quietroom.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up or log in
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure your project:
   - Framework Preset: Next.js
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Step 3: Add Environment Variables

1. In the Vercel project settings, go to the "Environment Variables" tab
2. Add the same environment variables you added to your `.env.local` file:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for the deployment to complete
3. Once deployed, Vercel will provide you with a URL to access your application

### Step 5: Configure Clerk for Production

1. Go back to your Clerk Dashboard
2. Add your Vercel deployment URL to the "Allowed URLs" section
3. If you're ready for production, create a production instance in Clerk and update your environment variables in Vercel

## 🔄 Future: Adding Supabase Integration

### Step 1: Create a Supabase Account

1. Go to [supabase.com](https://supabase.com) and sign up for a free account
2. Create a new project

### Step 2: Set Up Your Database

1. In your Supabase project, go to the SQL Editor
2. Create a table for entries:

```sql
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  photo TEXT NOT NULL,
  caption TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create an index for faster queries
CREATE INDEX entries_user_id_idx ON entries(user_id);
```

### Step 3: Add Supabase Environment Variables

1. In your Supabase project, go to Settings > API
2. Copy the URL and anon key
3. Add these to your environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 4: Update Your Code to Use Supabase

1. Install the Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```

2. Create a Supabase client in your application
3. Update your storage functions to use Supabase instead of localStorage
4. Deploy your updated application

## 🎉 Congratulations!

Your QuietRoom application is now deployed and ready to use! Users can sign up, create entries, and enjoy their digital sanctuary. 