const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bcqusrvpyfirnzsoctvt.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function resetPassword(email, newPassword) {
    try {
        // Update user password directly
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users.users.find(u => u.email === email);

        if (!user) {
            console.error(`User with email ${email} not found`);
            return;
        }

        const { data, error } = await supabase.auth.admin.updateUserById(
            user.id,
            {
                password: newPassword,
                email_confirm: true
            }
        );

        if (error) {
            console.error('Error updating password:', error);
        } else {
            console.log(`✅ Password updated and email confirmed for ${email}`);
            console.log(`You can now login with: ${email} / ${newPassword}`);
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

// Usage: node scripts/reset-password.js
const email = process.argv[2] || 'marcosmelo722@gmail.com';
const password = process.argv[3] || '225800';

resetPassword(email, password);
