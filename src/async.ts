// Part C - asynchronous code against a real database

import { pool } from './db.js';
import { findStudent, coursesFor, deleteStudent } from './queries.js';

export interface Overview {
  students: number;
  courses: number;
  departments: number;
}

// --- C1. Steps that depend on each other ----------------------------------

/**
 * The title of the first course a student takes, or undefined when the
 * student does not exist or takes nothing.
 *
 * Two steps, the second needing the first. Handle a missing student with
 * try/catch or with a check, and say in a comment which you chose and why.
 */
export async function firstCourseTitle(studentId: string): Promise<string | undefined> {
  const student = await findStudent(studentId);

  if (!student) {
    return undefined;
  }

  const courses = await coursesFor(studentId);
  if (courses.length === 0) {
    return undefined;
  }
  return courses[0].title;
}
//Sigurd: I use a check because findStudent returns undefined for a missing student.
//Should pass database errors to the code that calls this function.

// --- C2. Steps that do not depend on each other ---------------------------

/**
 * Three counts: students, courses, departments.
 *
 * Write it twice. overviewSlowly does one query after another; overview
 * starts all three together. The runner times both.
 *
 * Use this query, and note the pg_sleep: each count is made to take about
 * 200 ms on purpose.
 *
 *     SELECT pg_sleep(0.2), count(*)::int AS total FROM student
 *
 * Without it the three counts against a local database finish in about a
 * millisecond each, and starting them together costs more than it saves,
 * because the pool has to open two more connections. Waiting is what makes
 * the difference visible, and on a real server the waiting is real.
 */
export async function overviewSlowly(): Promise<Overview> {
  const sResult = await pool.query('SELECT pg_sleep(0.2), count(*)::int AS total FROM student');
  const cResult = await pool.query('SELECT pg_sleep(0.2), count(*)::int AS total FROM course');
  const dResult = await pool.query('SELECT pg_sleep(0.2), count(*)::int AS total FROM department');

  return{
    students: sResult.rows[0].total,
    courses: cResult.rows[0].total,
    departments: dResult.rows[0].total
  };

}


export async function overview(): Promise<Overview> {
  const sPromise = pool.query('SELECT pg_sleep(0.2), count(*)::int AS total FROM student');
  const cPromise = pool.query('SELECT pg_sleep(0.2), count(*)::int AS total FROM course');
  const dPromise = pool.query('SELECT pg_sleep(0.2), count(*)::int AS total FROM department');

  const [sResult, cResult, dResult] = await Promise.all([
      sPromise,
      cPromise,
      dPromise
  ]);
  return {
    students: sResult.rows[0].total,
    courses: cResult.rows[0].total,
    departments: dResult.rows[0].total
  };
}

// --- C3. The forgotten await ----------------------------------------------

/**
 * Written for you, and wrong.
 *
 * It should delete a student and then report whether they are still there.
 * It reports that they are. Run it, explain in a comment what happens and
 * in which order, then write the corrected version below.
 *
 * There is a second problem, worse than the wrong answer: if the delete
 * fails, who finds out?
 */
export async function removeAndCheckBroken(id: string): Promise<boolean> {
  // The delete starts, but its promise is ignored. The lookup starts next
  // without waiting for the delete and can find the student before deletion
  // finishes, returning true. This is a race: the result depends on timing.
  // If deletion fails, the caller cannot catch it through this function:
  // the ignored promise rejects without a handler (an unhandled rejection).
  deleteStudent(id);
  const still = await findStudent(id);
  return still !== undefined;
}

/** The same thing, correct: false when the student is really gone. */
export async function removeAndCheck(id: string): Promise<boolean> {
  // Wait for deletion before looking up the student. A failure rejects this
  // function's promise so the caller can catch it; the lookup is then skipped.
  await deleteStudent(id);
  const still = await findStudent(id);
  return still !== undefined;
}
