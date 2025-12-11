import { createBrowserClient } from '@supabase/ssr'
import { env } from './env'

export function createClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('❌ Missing Supabase environment variables');
        throw new Error('Missing Supabase environment variables');
    }

    // Debug log to verify key presence (safe log - dev only)
    if (process.env.NODE_ENV !== 'production') {
        console.log('✅ Supabase Client Initializing:', {
            url: supabaseUrl,
            keyLength: supabaseAnonKey?.length,
            keyStart: supabaseAnonKey?.substring(0, 5) + '...'
        });
    }

    return createBrowserClient(supabaseUrl, supabaseAnonKey);
}


export async function getCurrentUser() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

// Helper to get user subscription
export async function getUserSubscription(userId: string) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (error) {
        console.error('Error fetching subscription:', error)
        return null
    }

    return data
}

// Helper to check if user can make request
export async function canMakeRequest(userId: string) {
    const subscription = await getUserSubscription(userId)

    if (!subscription) {
        return { allowed: false, reason: 'No subscription found' }
    }

    if (subscription.status !== 'active') {
        return { allowed: false, reason: 'Subscription not active' }
    }

    if (subscription.quota_used >= subscription.quota_limit) {
        return {
            allowed: false,
            reason: 'Quota exceeded',
            quota: {
                used: subscription.quota_used,
                limit: subscription.quota_limit
            }
        }
    }

    return {
        allowed: true,
        quota: {
            used: subscription.quota_used,
            limit: subscription.quota_limit,
            remaining: subscription.quota_limit - subscription.quota_used
        }
    }
}

// Helper to increment usage
export async function incrementUsage(userId: string) {
    const supabase = createClient()

    const { error } = await supabase.rpc('increment_quota', {
        p_user_id: userId
    })

    if (error) {
        console.error('Error incrementing quota:', error)
    }
}
