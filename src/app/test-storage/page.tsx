"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useSupabaseClient } from "@/lib/supabase-auth";
import { uploadImage } from "@/lib/image-upload";
import { debugStorageAccess, formatStorageDebugInfo } from "@/lib/storage-debug";
import { createClient } from '@supabase/supabase-js';

export default function TestStoragePage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const { getToken } = useAuth();
  const { supabase, isLoading: isSupabaseLoading, authDebug } = useSupabaseClient();
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [jwtDebug, setJwtDebug] = useState<string | null>(null);

  useEffect(() => {
    const checkJWT = async () => {
      if (!user || !getToken) return;
      
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) {
          console.error('No JWT token returned');
          return;
        }

        // Decode JWT to check claims
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          setJwtDebug(JSON.stringify({
            claims: payload,  // Show all claims
            userId: user.id,
            token_preview: token.substring(0, 15) + '...'
          }, null, 2));

          // Log the full payload for debugging
          console.log('JWT payload:', payload);
        }
      } catch (error) {
        console.error('JWT check error:', error);
        setJwtDebug(JSON.stringify({ error: String(error) }, null, 2));
      }
    };

    checkJWT();
  }, [user, getToken]);

  const log = (message: string) => {
    setTestResults(prev => [...prev, message]);
  };

  const testJWT = async () => {
    log("🔑 Testing JWT token...");
    try {
      // Get JWT token from Clerk
      const token = await getToken({ template: "supabase" });
      if (!token) {
        log("❌ No JWT token returned from Clerk");
        return;
      }
      
      // Show first part of the token for debugging
      const shortToken = token.substring(0, 20) + "...";
      log(`✅ Got JWT token: ${shortToken}`);
      
      // Parse the token to show payload
      const parts = token.split('.');
      if (parts.length !== 3) {
        log("❌ Invalid JWT format");
        return;
      }
      
      try {
        const payload = JSON.parse(atob(parts[1]));
        setJwtDebug(JSON.stringify(payload, null, 2));
        
        // Log important claims
        log(`📋 JWT contains these claims:`);
        log(`   - sub: ${payload.sub || 'MISSING'}`);
        log(`   - role: ${payload.role || 'MISSING'}`);
        log(`   - aud: ${payload.aud || 'MISSING'}`);
        log(`   - iss: ${payload.iss || 'MISSING'}`);
      } catch (e) {
        log("❌ Error parsing JWT payload");
      }
    } catch (error) {
      log(`❌ JWT error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testBuckets = async () => {
    log("Testing bucket access...");
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        log(`❌ Error listing buckets: ${error.message}`);
        return;
      }
      
      log(`📦 Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
      });

      return buckets;
    } catch (error) {
      log(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testUpload = async () => {
    if (!user) {
      log("❌ No user is signed in");
      return;
    }

    log(`Testing upload for user ${user.id}...`);
    
    try {
      // Create a simple test image file (1x1 pixel PNG)
      const testImageData = new Uint8Array([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 image
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);
      
      const testImageFile = new File([testImageData], 'test-image.png', {
        type: 'image/png'
      });
      
      // Test direct upload to storage
      log("Testing direct storage upload...");
      const testFilePath = `${user.id}/test-image.png`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('journal-entries')
        .upload(testFilePath, testImageData, {
          contentType: 'image/png',
          upsert: true
        });
      
      if (uploadError) {
        log(`❌ Direct upload failed: ${uploadError.message}`);
      } else {
        log("✅ Direct upload successful!");
        
        // Get URL
        const { data: { publicUrl } } = supabase.storage
          .from('journal-entries')
          .getPublicUrl(testFilePath);
        
        log(`📄 File URL: ${publicUrl}`);
        
        // Try to delete the file
        const { error: deleteError } = await supabase.storage
          .from('journal-entries')
          .remove([testFilePath]);
        
        if (deleteError) {
          log(`❌ Deletion failed: ${deleteError.message}`);
        } else {
          log("✅ File deletion successful");
        }
      }
      
      // Test using the uploadImage function
      log("\nTesting uploadImage function...");
      const uploadResult = await uploadImage(user.id, testImageFile, 'test-image.png', supabase);
      
      if (uploadResult.success) {
        log("✅ Image upload successful!");
        log(`📄 Image URL: ${uploadResult.url}`);
        log(`📁 File info: ${uploadResult.fileName}, ${uploadResult.fileSize} bytes, ${uploadResult.fileFormat}`);
      } else {
        log(`❌ Image upload failed: ${uploadResult.error}`);
      }
    } catch (error) {
      log(`❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const simpleStorageTest = async () => {
    log("🔄 Running simple storage test...");
    
    if (!user) {
      log("❌ No user signed in");
      return;
    }

    try {
      // Get a fresh token
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        log("❌ No token received from Clerk");
        return;
      }

      // Create a fresh Supabase client with the token
      const testClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );

      // Test simple upload
      const testData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header
      const testPath = `${user.id}/simple-test-${Date.now()}.png`;

      log(`📤 Testing upload to: ${testPath}`);

      const { data: uploadData, error: uploadError } = await testClient.storage
        .from('journal-entries')
        .upload(testPath, testData, {
          contentType: 'image/png',
          upsert: true
        });

      if (uploadError) {
        log(`❌ Upload failed: ${uploadError.message}`);
        
        // Try to get more details about the error
        log(`Error details: ${JSON.stringify(uploadError, null, 2)}`);
      } else {
        log("✅ Upload successful!");
        
        // Test download
        const { data: downloadData, error: downloadError } = await testClient.storage
          .from('journal-entries')
          .download(testPath);
          
        if (downloadError) {
          log(`❌ Download failed: ${downloadError.message}`);
        } else {
          log("✅ Download successful!");
        }

        // Cleanup
        const { error: deleteError } = await testClient.storage
          .from('journal-entries')
          .remove([testPath]);
          
        if (deleteError) {
          log(`⚠️ Cleanup failed: ${deleteError.message}`);
        } else {
          log("✅ Cleanup successful!");
        }
      }
    } catch (error) {
      log(`❌ Test error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const runTests = async () => {
    setTestResults([]);
    setIsRunningTests(true);
    
    log("🧪 Starting comprehensive storage tests...");
    
    // Run simple storage test first
    await simpleStorageTest();
    
    log("\n" + "=".repeat(50));
    
    // Run comprehensive debug analysis
    log("🔍 Running storage debug analysis...");
    const debugInfo = await debugStorageAccess(supabase, user?.id);
    const debugReport = formatStorageDebugInfo(debugInfo);
    
    // Log the formatted report
    debugReport.split('\n').forEach(line => log(line));
    
    // Test JWT first
    await testJWT();
    
    // Test bucket access
    const buckets = await testBuckets();
    
    // If journal-entries bucket exists or if debug shows it's accessible, test upload
    if (buckets?.some(b => b.name === 'journal-entries') || debugInfo.bucketTests['journal-entries']?.canUpload) {
      await testUpload();
    } else {
      log("❌ Cannot test uploads: journal-entries bucket not accessible");
      log("💡 This could be due to missing RLS policies or bucket not existing");
    }
    
    log("🏁 Tests completed");
    setIsRunningTests(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Supabase Storage Test
        </h1>
        
        <div className="glass p-6 rounded-xl shadow-xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Storage Integration Tests</h2>
              <p className="text-slate-600">
                Test your Supabase storage integration and bucket policies
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setTestResults([]);
                  setIsRunningTests(true);
                  simpleStorageTest().finally(() => setIsRunningTests(false));
                }}
                disabled={isRunningTests || isSupabaseLoading || !isUserLoaded || !user}
                className={`glass-button px-4 py-3 rounded-xl ${
                  isRunningTests || isSupabaseLoading || !isUserLoaded || !user
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 transition-all duration-300'
                }`}
              >
                Quick Test
              </button>
              <button
                onClick={runTests}
                disabled={isRunningTests || isSupabaseLoading || !isUserLoaded || !user}
                className={`glass-button px-6 py-3 rounded-xl ${
                  isRunningTests || isSupabaseLoading || !isUserLoaded || !user
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105 transition-all duration-300'
                }`}
              >
                {isRunningTests ? 'Running Tests...' : 'Full Tests'}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 text-slate-100 rounded-xl p-4 font-mono text-sm overflow-auto h-96">
            {testResults.length === 0 ? (
              <p className="text-slate-400">Test results will appear here...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result.startsWith('❌') ? (
                    <p className="text-red-400">{result}</p>
                  ) : result.startsWith('✅') ? (
                    <p className="text-green-400">{result}</p>
                  ) : (
                    <p>{result}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Enhanced debug section */}
        {jwtDebug && (
          <div className="glass p-6 rounded-xl shadow-xl mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">JWT Debug Info</h2>
            <div className="space-y-4">
              <div className="bg-slate-800 text-slate-100 p-4 rounded-lg overflow-auto max-h-96">
                <pre>{jwtDebug}</pre>
              </div>
              <p className="text-sm text-slate-600">
                This shows the JWT claims that Supabase will use for authorization. 
                The <code className="px-1 py-0.5 bg-slate-100 rounded">sub</code> claim 
                should match your user ID for storage policies to work.
              </p>
            </div>
          </div>
        )}

        {authDebug && (
          <div className="glass p-6 rounded-xl shadow-xl mb-6">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Supabase Auth Debug</h2>
            <div className="bg-slate-800 text-slate-100 rounded-xl p-4 font-mono text-sm">
              <p>{authDebug}</p>
            </div>
          </div>
        )}
        
        <div className="glass p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-bold text-slate-800 mb-3">User Status</h2>
          {isUserLoaded ? (
            user ? (
              <p className="text-green-600">
                ✅ Signed in as {user.primaryEmailAddress?.emailAddress} (ID: {user.id})
              </p>
            ) : (
              <p className="text-red-600">
                ❌ Not signed in. Please sign in to test storage functionality.
              </p>
            )
          ) : (
            <p className="text-slate-600">Loading user information...</p>
          )}
          
          <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3">Supabase Status</h2>
          {isSupabaseLoading ? (
            <p className="text-slate-600">Initializing Supabase client...</p>
          ) : (
            <p className="text-green-600">✅ Supabase client ready</p>
          )}
        </div>
      </div>
    </div>
  );
} 

// Base64 decode function removed - we now only work with File objects 