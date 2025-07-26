# Storage Configuration Scripts

These scripts handle Supabase Storage setup and configuration.

## Scripts Overview

### Manual Setup (for restricted environments)
- **`2-manual-storage-setup.sql`** - Create storage schema and tables manually
- **`3-manual-storage-policies.sql`** - Create storage policies manually

### Production Configuration
- **`configure-existing-storage.sql`** - Configure existing storage infrastructure
- **`minimal-storage-config.sql`** - Minimal storage setup for restricted permissions
- **`public-buckets-setup.sql`** - Make buckets public for image display
- **`3-setup-storage-policies-fixed.sql`** - Fixed storage policies for production

### Troubleshooting
- **`storage-troubleshooting.sql`** - Diagnose and fix storage issues

## When to Use Each Script

- **Use manual scripts** if you get "permission denied for schema storage"
- **Use configure-existing** if storage exists but needs configuration
- **Use minimal-config** if you have very restricted permissions
- **Use public-buckets** to make buckets public for image display
- **Use troubleshooting** if you encounter storage errors

## Key Features

- Creates storage buckets for journal entries and thumbnails
- Sets up RLS policies for secure access
- Makes buckets public for image display
- Handles user-specific folder access
- Integrates with Clerk JWT authentication
