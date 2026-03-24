ALTER TABLE students
ADD COLUMN IF NOT EXISTS passing_year INTEGER;

UPDATE students
SET passing_year = 2027
WHERE passing_year IS NULL;
