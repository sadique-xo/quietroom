# 🧘‍♀️ QuietRoom

A sacred, minimal digital journal where users upload one photo + reflection per day. It offers a quiet sanctuary for self-journal and a silent "room" for presence—no feeds, no followers, no AI—just intentional daily ritual.

## 🌟 Features

- **One Daily Entry**: Upload one photo and reflection per day
- **Quiet Room**: A dedicated space for mindfulness with timer options
- **Calendar View**: Track your journaling consistency
- **Personal Stats**: Monitor your progress and streaks
- **Minimal Design**: Clean, glass morphism UI focused on calm
- **Private & Secure**: Authentication with Clerk

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
   - Copy `.env.local.example` to `.env.local`
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
- **Data Storage**: LocalStorage (MVP), Supabase (planned)
- **Deployment**: Vercel

## 📱 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add the environment variables from `.env.local`
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- Design inspiration from iOS 17 glass morphism
- Built with intention and care
