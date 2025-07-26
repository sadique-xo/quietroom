# 🧘‍♀️ QuietRoom

A sacred, minimal digital journal where users upload one photo + reflection per day. It offers a quiet sanctuary for self-journal and a silent "room" for presence—no feeds, no followers, no AI—just intentional daily ritual.

## 🌟 Features

- **One Daily Entry**: Upload one photo and reflection per day
- **Quiet Room**: A dedicated space for mindfulness with timer options
- **Calendar View**: Track your journaling consistency
- **Personal Stats**: Monitor your progress and streaks
- **Minimal Design**: Clean, glass morphism UI focused on calm
- **Private & Secure**: Authentication with Clerk

## 🆕 Recent Changes

- **Clerk + Supabase Integration**: Clerk authentication now issues JWTs for secure Supabase access. User IDs are stored as TEXT, and a custom `clerk_user_id()` function extracts the user ID from JWTs for Row Level Security (RLS).
- **Database & Storage Improvements**: The `entries` table schema is updated for Clerk compatibility. Image uploads use authenticated Supabase clients, and files are stored in user-specific folders within public buckets (`journal-entries`, `thumbnails`).
- **RLS Security**: RLS policies ensure users can only access their own data, both in the database and storage buckets.
- **Modern File Handling**: Images are uploaded as files (not base64), and displayed using `URL.createObjectURL()` for performance.
- **Debugging & Testing**: Enhanced logging and test pages for storage and database integration.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Clerk account for authentication
- (Future) Supabase account for data storage

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/quietroom.git
   cd quietroom
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `env.example` to `.env.local`
   - Create a Clerk account at [clerk.com](https://clerk.com)
   - Add your Clerk API keys to `.env.local`

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to view the app

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom glass morphism
- **Authentication**: Clerk
- **Data Storage**: Supabase PostgreSQL & Storage (active), LocalStorage (legacy/MVP)
- **Deployment**: Vercel

## 📱 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add the environment variables from `.env.local`
4. Deploy!

For detailed deployment instructions, see the [Deployment Guide](./docs/DEPLOYMENT.md).

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

- **[Production Guide](./docs/PRODUCTION_SUMMARY.md)** - Production readiness and deployment
- **[Technical Documentation](./docs/design-doc.md)** - Architecture and design details
- **[Development Tasks](./docs/tasks.md)** - Current development roadmap
- **[Storage Setup](./docs/STORAGE_FIX_GUIDE.md)** - Supabase storage configuration

See the [Documentation Index](./docs/README.md) for a complete list of available guides.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Design inspiration from iOS 17 glass morphism
- Built with intention and care
