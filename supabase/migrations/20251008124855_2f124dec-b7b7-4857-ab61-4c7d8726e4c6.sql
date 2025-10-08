
-- Drop existing FKs that point to auth.users
ALTER TABLE insurance_approval_requests
  DROP CONSTRAINT IF EXISTS insurance_approval_requests_requested_by_fkey,
  DROP CONSTRAINT IF EXISTS insurance_approval_requests_decided_by_fkey;

-- Create new FKs pointing to user_profiles
ALTER TABLE insurance_approval_requests
  ADD CONSTRAINT insurance_approval_requests_requested_by_fkey 
  FOREIGN KEY (requested_by) 
  REFERENCES user_profiles(id) 
  ON DELETE CASCADE;

ALTER TABLE insurance_approval_requests
  ADD CONSTRAINT insurance_approval_requests_decided_by_fkey 
  FOREIGN KEY (decided_by) 
  REFERENCES user_profiles(id) 
  ON DELETE SET NULL;
