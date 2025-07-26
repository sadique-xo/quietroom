import { SupabaseClient } from '@supabase/supabase-js';

interface JWTPayload {
  sub?: string;
  user_id?: string;
  role?: string;
  exp?: number;
  aud?: string;
  iss?: string;
  [key: string]: unknown;
}

type SupabaseClientExtended = SupabaseClient & {
  headers?: Record<string, string>;
  rest?: {
    headers?: Record<string, string>;
    url?: string;
  };
  auth?: {
    headers?: Record<string, string>;
  };
  global?: {
    headers?: Record<string, string>;
  };
  supabaseKey?: string;
};

export interface StorageDebugInfo {
  bucketsAccessible: boolean;
  bucketCount: number;
  bucketNames: string[];
  jwt: {
    isValid: boolean;
    payload?: JWTPayload;
    error?: string;
  };
  userContext: {
    role?: string;
    userId?: string;
    isAuthenticated: boolean;
  };
  bucketTests: {
    [bucketName: string]: {
      canList: boolean;
      canUpload: boolean;
      error?: string;
    };
  };
}

/**
 * Comprehensive storage debugging utility
 */
export async function debugStorageAccess(
  supabase: SupabaseClient,
  clerkUserId?: string
): Promise<StorageDebugInfo> {
  const result: StorageDebugInfo = {
    bucketsAccessible: false,
    bucketCount: 0,
    bucketNames: [],
    jwt: { isValid: false },
    userContext: { isAuthenticated: false },
    bucketTests: {},
  };

  try {
    // 1. Test JWT token - improved extraction
    let authHeader = '';
    try {
          // Try multiple ways to get the auth header
    const extendedClient = supabase as SupabaseClientExtended;
    const clientHeaders = extendedClient.headers || 
                        extendedClient.supabaseKey ? {} : 
                        (extendedClient.rest?.headers || 
                         extendedClient.auth?.headers || 
                         extendedClient.global?.headers || {});
    
    authHeader = clientHeaders?.Authorization || 
                 (extendedClient.rest?.url && extendedClient.rest?.headers?.Authorization) ||
                 '';
    
    console.log('Debug - Auth header search results:', {
      hasHeaders: !!extendedClient.headers,
      hasRestHeaders: !!(extendedClient.rest?.headers),
      hasAuthHeaders: !!(extendedClient.auth?.headers),
      hasGlobalHeaders: !!(extendedClient.global?.headers),
      headerFound: !!authHeader
    });
      
      if (authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          // Parse JWT payload
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            
            // Check if token is expired
            const now = Math.floor(Date.now() / 1000);
            const isExpired = payload.exp && payload.exp < now;
            
            result.jwt = {
              isValid: !isExpired,
              payload,
              error: isExpired ? 'Token is expired' : undefined,
            };
            
            result.userContext = {
              role: payload.role || 'anon',
              userId: payload.sub || payload.user_id,
              isAuthenticated: payload.role === 'authenticated' && !isExpired,
            };
            
            console.log('JWT parsed successfully:', {
              sub: payload.sub,
              user_id: payload.user_id,
              role: payload.role,
              exp: payload.exp,
              isExpired,
              now,
              expDate: payload.exp ? new Date(payload.exp * 1000).toLocaleString() : 'No expiry'
            });
          }
        } catch {
          result.jwt = {
            isValid: false,
            error: 'Failed to parse JWT token',
          };
        }
      } else {
        // If we can't find the header, let's try to create a fresh token
        result.jwt = {
          isValid: false,
          error: 'No Authorization header found in client',
        };
      }
    } catch {
      result.jwt = {
        isValid: false,
        error: 'Could not access client headers',
      };
    }

    // 2. Test bucket listing
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      
      if (error) {
        result.bucketsAccessible = false;
        console.error('Bucket listing error:', error);
      } else {
        result.bucketsAccessible = true;
        result.bucketCount = buckets?.length || 0;
        result.bucketNames = buckets?.map(b => b.name) || [];
      }
    } catch {
      result.bucketsAccessible = false;
      console.error('Bucket listing exception: Unknown error');
    }

    // 3. Test individual bucket access
    const bucketsToTest = ['journal-entries', 'thumbnails'];
    
    for (const bucketName of bucketsToTest) {
      const bucketTest: {
        canList: boolean;
        canUpload: boolean;
        error?: string;
      } = {
        canList: false,
        canUpload: false,
      };

      // Test listing files in bucket
      try {
        const { error: listError } = await supabase.storage
          .from(bucketName)
          .list('', { limit: 1 });

        if (!listError) {
          bucketTest.canList = true;
        } else {
          bucketTest.error = `List error: ${listError.message}`;
        }
      } catch (e) {
        bucketTest.error = `List exception: ${e instanceof Error ? e.message : String(e)}`;
      }

      // Test upload to bucket (if we have a user ID)
      if (clerkUserId && result.userContext.isAuthenticated) {
        try {
          // Create a simple image buffer for testing
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
          
          const testFileName = `${clerkUserId}/test-debug-${Date.now()}.png`;

          const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(testFileName, testImageData, {
              contentType: 'image/png',
              upsert: true,
            });

          if (!uploadError) {
            bucketTest.canUpload = true;
            
            // Clean up test file
            await supabase.storage
              .from(bucketName)
              .remove([testFileName]);
          } else {
            bucketTest.error = `${bucketTest.error || ''} Upload error: ${uploadError.message}`.trim();
          }
        } catch (e) {
          bucketTest.error = `${bucketTest.error || ''} Upload exception: ${e instanceof Error ? e.message : String(e)}`.trim();
        }
      }

      result.bucketTests[bucketName] = bucketTest;
    }

  } catch (error) {
    console.error('Debug storage access error:', error);
  }

  return result;
}

/**
 * Pretty print storage debug information
 */
export function formatStorageDebugInfo(info: StorageDebugInfo): string {
  const lines: string[] = [];
  
  lines.push('🔍 STORAGE DEBUG REPORT');
  lines.push('=' .repeat(50));
  
  // JWT Info
  lines.push('🔑 JWT Token:');
  if (info.jwt.isValid) {
    lines.push(`   ✅ Valid JWT found`);
    lines.push(`   📋 Role: ${info.userContext.role}`);
    lines.push(`   👤 User ID: ${info.userContext.userId}`);
    lines.push(`   🔐 Authenticated: ${info.userContext.isAuthenticated}`);
    if (info.jwt.payload?.exp) {
      const expDate = new Date(info.jwt.payload.exp * 1000);
      lines.push(`   ⏰ Expires: ${expDate.toLocaleString()}`);
    }
  } else {
    lines.push(`   ❌ Invalid or missing JWT: ${info.jwt.error}`);
  }
  
  lines.push('');
  
  // Bucket Access
  lines.push('📦 Bucket Listing:');
  if (info.bucketsAccessible) {
    lines.push(`   ✅ Can list buckets (${info.bucketCount} found)`);
    lines.push(`   📁 Available buckets: ${info.bucketNames.join(', ')}`);
  } else {
    lines.push(`   ❌ Cannot list buckets (this is normal for non-admin users)`);
  }
  
  lines.push('');
  
  // Individual Bucket Tests
  lines.push('🧪 Individual Bucket Tests:');
  for (const [bucketName, test] of Object.entries(info.bucketTests)) {
    lines.push(`   📁 ${bucketName}:`);
    lines.push(`      📋 Can list: ${test.canList ? '✅' : '❌'}`);
    lines.push(`      📤 Can upload: ${test.canUpload ? '✅' : '❌'}`);
    if (test.error) {
      lines.push(`      ⚠️  Errors: ${test.error}`);
    }
  }
  
  lines.push('');
  lines.push('💡 Next Steps:');
  
  if (!info.jwt.isValid) {
    lines.push('   1. Check Clerk JWT template configuration');
    lines.push('   2. Verify JWT expiration and timestamp format');
    lines.push('   3. Ensure JWT is being passed to Supabase client');
  }
  
  if (!info.bucketsAccessible) {
    lines.push('   1. Add RLS policies for storage.buckets table');
    lines.push('   2. Or test individual bucket operations directly');
  }
  
  const failedBuckets = Object.entries(info.bucketTests)
    .filter(([, test]) => !test.canList && !test.canUpload);
    
  if (failedBuckets.length > 0) {
    lines.push('   3. Check storage.objects policies for failed buckets');
    lines.push('   4. Verify bucket names exist in Supabase dashboard');
  }
  
  return lines.join('\n');
} 