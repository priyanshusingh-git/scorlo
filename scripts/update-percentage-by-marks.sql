-- Update overall_percentage in student_metrics based on total marks obtained across all sessions.
-- Formula: (SUM(marks_obtained) / SUM(marks_maximum)) * 100

-- Clear previous percentages if needed or just update those with session data
UPDATE student_metrics sm
SET overall_percentage = sub.calculated_percentage
FROM (
    SELECT 
        student_id,
        (SUM(marks_obtained)::numeric / NULLIF(SUM(marks_maximum), 0)) * 100 as calculated_percentage
    FROM result_sessions
    GROUP BY student_id
) sub
WHERE sm.student_id = sub.student_id;

-- Ensure that even if overall_percentage was NULL it gets updated
-- (Already handled by the JOIN above IF the student exists in both tables)

-- Optional: If some students have student_metrics but NO result_sessions, 
-- we might want to set their percentage to NULL if it's no longer valid.
-- UPDATE student_metrics sm
-- SET overall_percentage = NULL
-- WHERE NOT EXISTS (SELECT 1 FROM result_sessions rs WHERE rs.student_id = sm.student_id);
