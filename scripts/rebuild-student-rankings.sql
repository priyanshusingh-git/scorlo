TRUNCATE TABLE student_rankings;

WITH semester_credits(semester_no, credit) AS (
  VALUES
    (1, 22::numeric),
    (2, 22::numeric),
    (3, 23::numeric),
    (4, 21::numeric),
    (5, 23::numeric),
    (6, 21::numeric),
    (7, 19::numeric),
    (8, 16::numeric)
),
ranked_semesters AS (
  SELECT
    rs.student_id,
    sr.semester_no,
    sr.sgpa,
    ROW_NUMBER() OVER (
      PARTITION BY rs.student_id, sr.semester_no
      ORDER BY
        rs.session_id DESC NULLS LAST,
        CASE WHEN UPPER(COALESCE(rs.session_type, '')) = 'BACK' THEN 1 ELSE 0 END DESC,
        sr.date_of_declaration DESC NULLS LAST,
        sr.id DESC
    ) AS row_no
  FROM semester_results sr
  JOIN result_sessions rs ON rs.id = sr.result_session_id
),
latest_semesters AS (
  SELECT
    student_id,
    semester_no,
    sgpa
  FROM ranked_semesters
  WHERE row_no = 1
),
weighted_cgpa AS (
  SELECT
    ls.student_id,
    ROUND(SUM(ls.sgpa * sc.credit) / SUM(sc.credit), 2) AS cgpa
  FROM latest_semesters ls
  JOIN semester_credits sc ON sc.semester_no = ls.semester_no
  WHERE ls.sgpa IS NOT NULL
  GROUP BY ls.student_id
),
latest_marks AS (
  SELECT DISTINCT ON (rs.student_id)
    rs.student_id,
    rs.marks_obtained
  FROM result_sessions rs
  ORDER BY rs.student_id, rs.created_at DESC NULLS LAST, rs.id DESC
),
student_base AS (
  SELECT
    s.id AS student_id,
    s.roll_no,
    s.name,
    s.institute_name,
    s.branch_name,
    s.course_name,
    s.passing_year,
    sm.overall_percentage,
    COALESCE(wc.cgpa, sm.cgpa) AS cgpa,
    sm.latest_sgpa,
    sm.active_backs,
    lm.marks_obtained
  FROM students s
  JOIN student_metrics sm ON sm.student_id = s.id
  LEFT JOIN weighted_cgpa wc ON wc.student_id = s.id
  LEFT JOIN latest_marks lm ON lm.student_id = s.id
),
branch_percentage AS (
  SELECT
    sb.student_id,
    'branch'::varchar(16) AS scope_key,
    'percentage'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    sb.overall_percentage AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
      ORDER BY sb.overall_percentage DESC, sb.cgpa DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.overall_percentage IS NOT NULL
),
batch_percentage AS (
  SELECT
    sb.student_id,
    'batch'::varchar(16) AS scope_key,
    'percentage'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    sb.overall_percentage AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.passing_year
      ORDER BY sb.overall_percentage DESC, sb.cgpa DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.overall_percentage IS NOT NULL
),
branch_cgpa AS (
  SELECT
    sb.student_id,
    'branch'::varchar(16) AS scope_key,
    'cgpa'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    sb.cgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
      ORDER BY sb.cgpa DESC, sb.overall_percentage DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.cgpa IS NOT NULL
),
batch_cgpa AS (
  SELECT
    sb.student_id,
    'batch'::varchar(16) AS scope_key,
    'cgpa'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    sb.cgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.passing_year
      ORDER BY sb.cgpa DESC, sb.overall_percentage DESC NULLS LAST, sb.active_backs ASC, sb.latest_sgpa DESC NULLS LAST, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.cgpa IS NOT NULL
),
branch_latest AS (
  SELECT
    sb.student_id,
    'branch'::varchar(16) AS scope_key,
    'latest'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    sb.latest_sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
      ORDER BY sb.latest_sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.latest_sgpa IS NOT NULL
),
batch_latest AS (
  SELECT
    sb.student_id,
    'batch'::varchar(16) AS scope_key,
    'latest'::varchar(32) AS metric_key,
    0::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    sb.latest_sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.passing_year
      ORDER BY sb.latest_sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.passing_year
    ) AS total_students
  FROM student_base sb
  WHERE sb.latest_sgpa IS NOT NULL
),
branch_semester_sgpa AS (
  SELECT
    ls.student_id,
    'branch'::varchar(16) AS scope_key,
    'semester_sgpa'::varchar(32) AS metric_key,
    ls.semester_no::smallint AS semester_no,
    sb.institute_name,
    sb.branch_name,
    sb.course_name,
    sb.passing_year,
    ls.sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year, ls.semester_no
      ORDER BY ls.sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.branch_name, sb.course_name, sb.passing_year, ls.semester_no
    ) AS total_students
  FROM latest_semesters ls
  JOIN student_base sb ON sb.student_id = ls.student_id
  WHERE ls.sgpa IS NOT NULL
),
batch_semester_sgpa AS (
  SELECT
    ls.student_id,
    'batch'::varchar(16) AS scope_key,
    'semester_sgpa'::varchar(32) AS metric_key,
    ls.semester_no::smallint AS semester_no,
    sb.institute_name,
    NULL::text AS branch_name,
    NULL::text AS course_name,
    sb.passing_year,
    ls.sgpa AS score,
    RANK() OVER (
      PARTITION BY sb.institute_name, sb.passing_year, ls.semester_no
      ORDER BY ls.sgpa DESC, sb.marks_obtained DESC NULLS LAST, sb.active_backs ASC, sb.roll_no ASC
    ) AS rank,
    COUNT(*) OVER (
      PARTITION BY sb.institute_name, sb.passing_year, ls.semester_no
    ) AS total_students
  FROM latest_semesters ls
  JOIN student_base sb ON sb.student_id = ls.student_id
  WHERE ls.sgpa IS NOT NULL
)
INSERT INTO student_rankings (
  student_id,
  scope_key,
  metric_key,
  semester_no,
  institute_name,
  branch_name,
  course_name,
  passing_year,
  score,
  rank,
  total_students
)
SELECT * FROM branch_percentage
UNION ALL
SELECT * FROM batch_percentage
UNION ALL
SELECT * FROM branch_cgpa
UNION ALL
SELECT * FROM batch_cgpa
UNION ALL
SELECT * FROM branch_latest
UNION ALL
SELECT * FROM batch_latest
UNION ALL
SELECT * FROM branch_semester_sgpa
UNION ALL
SELECT * FROM batch_semester_sgpa;
