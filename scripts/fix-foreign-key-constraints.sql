-- Fix foreign key constraints to handle user deletion properly
-- Drop existing constraint and recreate with CASCADE

ALTER TABLE shifts 
DROP CONSTRAINT IF EXISTS shifts_created_by_fkey;

ALTER TABLE shifts 
ADD CONSTRAINT shifts_created_by_fkey 
FOREIGN KEY (created_by) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Also check if there are other tables that reference users
-- and fix them as well

-- If there's an assigned_to column in shifts table
ALTER TABLE shifts 
DROP CONSTRAINT IF EXISTS shifts_assigned_to_fkey;

ALTER TABLE shifts 
ADD CONSTRAINT shifts_assigned_to_fkey 
FOREIGN KEY (assigned_to) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Add any other foreign key constraints that might reference users
-- For example, if there are other tables like time_off_requests, etc.
