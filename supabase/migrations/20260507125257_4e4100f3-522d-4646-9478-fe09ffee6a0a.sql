-- Enable RLS on realtime.messages and restrict subscriptions to authenticated users
-- This blocks anonymous clients from receiving any Realtime broadcast/postgres_changes/presence events.
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_can_receive_realtime" ON realtime.messages;
DROP POLICY IF EXISTS "authenticated_can_send_realtime" ON realtime.messages;

-- Allow only authenticated sessions to receive Realtime events.
CREATE POLICY "authenticated_can_receive_realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);

-- Allow only authenticated sessions to publish (broadcast/presence) on Realtime channels.
CREATE POLICY "authenticated_can_send_realtime"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (true);