# QuietRoom Database Scripts

This directory contains SQL scripts for setting up and managing the QuietRoom database.

## Directory Structure

### 📁 `production-setup/`
Complete production database setup scripts in the correct order.

### 📁 `storage/`
Storage bucket configuration and policy scripts for Supabase Storage.

### 📁 `schema/`
Database schema modification and alignment scripts.

### 📁 `verification/`
Scripts to verify database setup and configuration.

## Quick Start for Production

1. Run scripts in `production-setup/` folder in order
2. If storage issues occur, use scripts in `storage/` folder
3. If schema differences exist, use scripts in `schema/` folder
4. Verify setup using scripts in `verification/` folder

## Script Naming Convention

- `1-*` - First step in setup process
- `2-*` - Second step in setup process
- `3-*` - Third step in setup process
- `4-*` - Verification step
- `*-manual-*` - Manual setup for restricted environments
- `*-fixed-*` - Fixed versions for production environments
