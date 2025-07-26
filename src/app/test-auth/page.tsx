"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, useAuth } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";

export default function TestAuthPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { supabase, isLoading: isSupabaseLoading } = useSupabaseClient();
  const [testResult, setTestResult] = useState<string>("Testing...");
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const testAuth = async () => {
      if (!isUserLoaded || !user || isSupabaseLoading) {
        setTestResult("Waiting for authentication...");
        return;
      }

      try {
        // Test 1: Get the JWT token
        const jwt = await getToken({ template: "supabase" });
        setToken(jwt ? jwt.substring(0, 20) + "..." : "No token");

        // Test 2: Try to query the entries table with RLS
        const { error } = await supabase
          .from("entries")
          .select("*")
          .limit(1);

        if (error) {
          setError(`Query error: ${error.message}`);
          setTestResult("Failed");
        } else {
          setTestResult("Success! Authentication is working correctly.");
        }
      } catch (err) {
        setError(`Error: ${err instanceof Error ? err.message : String(err)}`);
        setTestResult("Failed");
      }
    };

    testAuth();
  }, [isUserLoaded, user, isSupabaseLoading, supabase, getToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-6">Clerk-Supabase Authentication Test</h1>
        
        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">User Status</h2>
          <p>
            <strong>Signed in:</strong> {isUserLoaded ? (user ? "Yes" : "No") : "Loading..."}
          </p>
          {user && (
            <div className="mt-2">
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Email:</strong> {user.primaryEmailAddress?.emailAddress}</p>
            </div>
          )}
        </div>

        <div className="glass p-6 rounded-xl mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase JWT</h2>
          <p className="break-all">
            <strong>Token:</strong> {token || "Loading..."}
          </p>
        </div>

        <div className={`glass p-6 rounded-xl mb-6 ${testResult === "Success! Authentication is working correctly." ? "bg-green-50" : testResult === "Failed" ? "bg-red-50" : ""}`}>
          <h2 className="text-xl font-semibold mb-4">Test Result</h2>
          <p><strong>Status:</strong> {testResult}</p>
          {error && (
            <div className="mt-2 p-4 bg-red-100 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="glass-button px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 