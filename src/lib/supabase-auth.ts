import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Hook to get a Supabase client with the Clerk user's JWT
 */
export function useSupabaseClient() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [supabase, setSupabase] = useState(() => createClient(supabaseUrl, supabaseAnonKey));
  const [authDebug, setAuthDebug] = useState<string | null>(null);
  
  useEffect(() => {
    const setupSupabase = async () => {
      if (!isLoaded) return;
      
      try {
        if (isSignedIn) {
          console.log("Getting Clerk JWT for Supabase...");
          const token = await getToken({ template: 'supabase' });
          
          if (!token) {
            console.error("No JWT token returned from Clerk!");
            setAuthDebug("Error: No JWT token returned from Clerk");
            setSupabase(createClient(supabaseUrl, supabaseAnonKey));
            setIsLoading(false);
            return;
          }
          
          // Log JWT payload for debugging
          try {
            const [, payload] = token.split('.');
            const decodedPayload = JSON.parse(atob(payload));
            console.log("JWT payload:", {
              sub: decodedPayload.sub,
              user_id: decodedPayload.user_id,
              role: decodedPayload.role,
              aud: decodedPayload.aud,
              exp: decodedPayload.exp,
              iat: decodedPayload.iat,
              expiry: decodedPayload.exp ? new Date(decodedPayload.exp * 1000).toLocaleString() : 'No expiry'
            });
            
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            if (decodedPayload.exp && decodedPayload.exp < now) {
              console.error("JWT token is expired!");
              setAuthDebug("Error: JWT token is expired");
              setSupabase(createClient(supabaseUrl, supabaseAnonKey));
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Error decoding JWT:", e);
          }
          
          // Create new client with auth header
          const client = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          });
          
          // Store the auth header for debugging access
          (client as unknown as { headers?: Record<string, string> }).headers = {
            Authorization: `Bearer ${token}`,
          };
          
          setSupabase(client);
          setAuthDebug(`JWT configured successfully. Expires: ${
            (() => {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiry set';
              } catch {
                return 'Unknown';
              }
            })()
          }`);
        } else {
          console.log("User not signed in, using anonymous client");
          setSupabase(createClient(supabaseUrl, supabaseAnonKey));
          setAuthDebug("Not signed in, using anonymous client");
        }
      } catch (error) {
        console.error('Error setting up Supabase client:', error);
        setAuthDebug(`Error: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupSupabase();
  }, [isLoaded, isSignedIn, getToken]);
  
  return { supabase, isLoading, authDebug };
} 