# Production Setup Scripts

These scripts set up the complete production database for QuietRoom.

## Execution Order

1. **`1-setup-tables.sql`** - Create database tables and JWT functions
2. **`2-setup-storage-buckets.sql`** - Create storage buckets (if storage extension available)
3. **`3-setup-storage-policies.sql`** - Create storage RLS policies (if storage extension available)
4. **`4-verification.sql`** - Verify complete setup

## Alternative for Restricted Environments

If you encounter storage permission issues, use scripts from the `../storage/` folder instead of steps 2-3.

## What These Scripts Do

- Create the `entries` table with all required columns
- Set up JWT functions for Clerk integration
- Enable Row Level Security (RLS)
- Create storage buckets and policies
- Verify all components are working correctly

## Requirements

- Supabase project with postgres role access
- Clerk authentication configured
- Storage extension enabled (or use manual setup scripts)
