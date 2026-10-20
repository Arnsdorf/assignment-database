import { pool } from './db.js';

export interface Student {
  id: string;
  name: string;
  deptName: string;
  totCred: number;
}

export interface CourseRow {
  courseId: string;
  title: string;
  grade: string | null;
}

export interface DeptCount {
  deptName: string;
  students: number;
}

export async function listStudents(limit: number, offset: number): Promise<Student[]> {
  const result = await pool.query<Student>(
  `SELECT id, name, dept_name AS "deptName", tot_cred::int AS "totCred"
     FROM student
     ORDER BY id
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}


export async function findStudent(id: string): Promise<Student | undefined> {
    const result = await pool.query<Student>(
  `SELECT id, name,
            dept_name AS "deptName",
            tot_cred::int AS "totCred"
     FROM student
     WHERE id = $1`,
    [id] // sender id som $1, ikke SQL-tekst
  );
  return result.rows[0]; // undefined, når studenten ikke findes
}


export async function studentsIn(deptName: string): Promise<Student[]> {
const result = await pool.query<Student>(
    `SELECT id, name, dept_name AS "deptName", tot_cred::int AS "totCred"
     FROM student
     WHERE dept_name = $1
     ORDER BY name`,
    [deptName]
  );
  return result.rows;
}


export async function coursesFor(studentId: string): Promise<CourseRow[]> {
const result = await pool.query<CourseRow>(
    `SELECT t.course_id AS "courseId",
            c.title,
            danish_grade(t.grade) AS grade
     FROM takes t
     JOIN course c ON t.course_id = c.course_id
     WHERE t.id = $1
     ORDER BY t.course_id`,
    [studentId]
  );
  return result.rows;
}



export async function studentsPerDepartment(): Promise<DeptCount[]> {
   const result = await pool.query<DeptCount>( // ::int gør count til et tal
    `SELECT dept_name AS "deptName",
            COUNT(*)::int AS students
     FROM student
     GROUP BY dept_name
     ORDER BY dept_name`
  );
  return result.rows; // GROUP BY giver en række pr. afdeling
}



export async function insertStudent(student: Student): Promise<Student> {
   const result = await pool.query<Student>(
    `INSERT INTO student (id, name, dept_name, tot_cred)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, dept_name AS "deptName", tot_cred::int AS "totCred"`,
    [student.id, student.name, student.deptName, student.totCred]
  );
  return result.rows[0]; // tager rækken fra RETURNING
}

export async function deleteStudent(id: string): Promise<boolean> {
  const result = await pool.query(
    `DELETE FROM student WHERE id = $1`,
    [id]
  );
  return result.rowCount === 1;
}

