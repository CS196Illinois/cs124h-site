-- Keep the public staff page current-semester-first and leadership-first.
UPDATE staff
SET semester_order = CASE semester
  WHEN 'Fall 2026' THEN 0
  WHEN 'Spring 2026' THEN 1
  WHEN 'Fall 2025' THEN 2
  WHEN 'Spring 2025' THEN 3
  ELSE semester_order
END;

WITH ranked AS (
  SELECT id,
    row_number() OVER (
      PARTITION BY semester
      ORDER BY CASE WHEN role = 'Course Lead' THEN 0 ELSE 1 END,
               member_order, id
    ) - 1 AS next_member_order
  FROM staff
)
UPDATE staff
SET member_order = ranked.next_member_order
FROM ranked
WHERE staff.id = ranked.id;
