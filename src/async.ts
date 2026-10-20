import { pool } from './db.js';
import { findStudent, coursesFor, deleteStudent } from './queries.js';

export interface Overview {
  students: number;
  courses: number;
  departments: number;
}

export async function firstCourseTitle(studentId: string): Promise<string | undefined> {
  const student = await findStudent(studentId);
  if (student === undefined) return undefined; // tjekker her, fordi en manglende student ikke er en fejl
  const courses = await coursesFor(studentId);
  return courses[0]?.title; // ?. giver undefined, hvis der ikke er et kursus
}

export async function overviewSlowly(): Promise<Overview> {
  const students = await pool.query<{ total: number }>(
    'SELECT pg_sleep(0.2), count(*)::int AS total FROM student'
  );
  const courses = await pool.query<{ total: number }>(
    'SELECT pg_sleep(0.2), count(*)::int AS total FROM course'
  );
  const departments = await pool.query<{ total: number }>(
    'SELECT pg_sleep(0.2), count(*)::int AS total FROM department'
  );
  return {
    students: students.rows[0].total,
    courses: courses.rows[0].total,
    departments: departments.rows[0].total
  };
}

export async function overview(): Promise<Overview> {
  const [students, courses, departments] = await Promise.all([ // starter uafhængige optællinger samtidig
    pool.query<{ total: number }>('SELECT pg_sleep(0.2), count(*)::int AS total FROM student'),
    pool.query<{ total: number }>('SELECT pg_sleep(0.2), count(*)::int AS total FROM course'),
    pool.query<{ total: number }>('SELECT pg_sleep(0.2), count(*)::int AS total FROM department')
  ]);
  return {
    students: students.rows[0].total,
    courses: courses.rows[0].total,
    departments: departments.rows[0].total
  };
}

export async function removeAndCheckBroken(id: string): Promise<boolean> {
  deleteStudent(id); // mangler await: søgningen kan nå først, og fejl overses
  const still = await findStudent(id);
  return still !== undefined;
}

export async function removeAndCheck(id: string): Promise<boolean> {
  await deleteStudent(id);
  const still = await findStudent(id);
  return still !== undefined;
}
