-- WhatsApp Sessions Table
-- Store conversation sessions and message history

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id TEXT PRIMARY KEY,
    phone TEXT NOT NULL,
    context TEXT NOT NULL CHECK (context IN ('public', 'operacional')),
    user_id UUID REFERENCES auth.users(id),
    messages JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone ON whatsapp_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON whatsapp_sessions(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_context ON whatsapp_sessions(context);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_last_activity ON whatsapp_sessions(last_activity);

-- RLS Policies (optional, but recommended)
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
CREATE POLICY "Service role has full access" ON whatsapp_sessions
    FOR ALL
    USING (auth.role() = 'service_role');

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own sessions" ON whatsapp_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Automated cleanup function (close sessions older than 1 hour)
CREATE OR REPLACE FUNCTION cleanup_old_whatsapp_sessions()
RETURNS void AS $$
BEGIN
    UPDATE whatsapp_sessions
    SET status = 'closed'
    WHERE status = 'active'
    AND last_activity < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (run every 30 minutes)
-- Note: This requires pg_cron extension
-- SELECT cron.schedule('cleanup-whatsapp-sessions', '*/30 * * * *', 'SELECT cleanup_old_whatsapp_sessions()');
