ALTER TABLE student_links
ALTER COLUMN dob SET NOT NULL;

ALTER TABLE data_requests
ALTER COLUMN dob SET NOT NULL;

ALTER TABLE student_links
DROP COLUMN IF EXISTS dob_encrypted;

ALTER TABLE data_requests
DROP COLUMN IF EXISTS dob_encrypted;
