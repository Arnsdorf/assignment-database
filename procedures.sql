CREATE OR REPLACE FUNCTION student_transcript(p_id varchar)
RETURNS TABLE (course_id varchar, title varchar, grade varchar)
LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM student WHERE id = p_id) THEN
    RAISE EXCEPTION 'No student with id %', p_id;
  END IF;

  RETURN QUERY
  SELECT t.course_id, c.title, danish_grade(t.grade)
  FROM takes t
  JOIN course c ON t.course_id = c.course_id -- kobler tilmelding og kurstitel
  WHERE t.id = p_id
  ORDER BY t.course_id;
END;
$$;

CREATE OR REPLACE PROCEDURE enrol_student(
  p_id varchar,
  p_course_id varchar,
  p_sec_id varchar,
  p_semester varchar,
  p_year numeric,
  INOUT new_total numeric DEFAULT NULL)
LANGUAGE plpgsql AS $$
DECLARE
  v_credits numeric;
BEGIN
  SELECT credits INTO v_credits
  FROM course
  WHERE course_id = p_course_id;

  IF NOT FOUND THEN -- SELECT'en fandt ikke kurset
    RAISE EXCEPTION 'No course with id %', p_course_id;
  END IF;

  INSERT INTO takes (id, course_id, sec_id, semester, year, grade)
  VALUES (p_id, p_course_id, p_sec_id, p_semester, p_year, NULL);

  UPDATE student
  SET tot_cred = tot_cred + v_credits
  WHERE id = p_id
  RETURNING tot_cred INTO new_total; -- INOUT-værdi tilbage til TypeScript
END;
$$;
