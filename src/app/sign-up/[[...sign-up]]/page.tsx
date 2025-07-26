import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="glass px-6 py-3 flex items-center space-x-3 rounded-2xl shadow-lg">
            <Image
              src="/images/Icon v3.webp"
              alt="QuietRoom Icon"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <Image
              src="/images/Website Logo.webp"
              alt="QuietRoom"
              width={120}
              height={24}
              className="h-6 w-auto"
            />
          </div>
        </div>

        {/* Sign Up Form */}
        <div className="glass p-8 rounded-3xl shadow-xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Join Your Sanctuary
            </h1>
            <p className="text-lg text-slate-600">
              Start your daily ritual of presence
            </p>
          </div>
          
          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 'glass-button w-full py-4 text-lg font-semibold rounded-2xl hover:scale-105 transition-all duration-300',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-slate-800 text-xl font-semibold',
                headerSubtitle: 'text-slate-600',
                formFieldInput: 'glass-input w-full p-4 text-lg rounded-2xl',
                formFieldLabel: 'text-slate-700 font-semibold',
                footerActionLink: 'text-purple-600 hover:text-purple-700 font-medium',
                dividerLine: 'bg-slate-200',
                dividerText: 'text-slate-500',
              }
            }}
          />
        </div>
      </div>
    </div>
  );
} 