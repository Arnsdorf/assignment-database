// Part B1 - one operation, two statements, one transaction

import {pool} from './db.js';
import {Client} from "pg";

export interface EnrolInput {
    studentId: string;
    courseId: string;
    secId: string;
    semester: string;
    year: number;
}

/**
 * Enrols a  student in a course section and adds the course credits to the
 * student's total.
 *
 * Two statements:
 *   INSERT INTO takes (id, course_id, sec_id, semester, year, grade)
 *     VALUES ($1, $2, $3, $4, $5, NULL)
 *   UPDATE student SET tot_cred = tot_cred + <the course credits>
 *     WHERE id = $1
 *
 * They must both happen or neither. A student enrolled without the credits
 * being added is a database that quietly disagrees with itself.
 *
 * A transaction runs on one connection, so take a client from the pool
 * rather than using the pool directly: BEGIN, both statements, COMMIT, and
 * ROLLBACK if anything fails. Release the client in a finally block.
 *
 * Returns the student's new credit total.
 */
export async function enrolInTypeScript(input: EnrolInput): Promise<number> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const courseQuery = 'SELECT * FROM course WHERE course_id = $1';
        const courses = await client.query(courseQuery,
            [input.courseId]);

        if (courses.rows.length === 0) {
            throw new Error(`No course with id ${input.courseId}`);
        }
        const courseCredits = courses.rows[0].credits;

        const insertTakesQuery = `INSERT INTO takes (id, course_id, sec_id, semester, year, grade)
                                  VALUES ($1, $2, $3, $4, $5, NULL)`;

        await client.query(insertTakesQuery, [
            input.studentId,
            input.courseId,
            input.secId,
            input.semester,
            input.year
        ]);

        const updateStudent = `UPDATE student
                               SET tot_cred = tot_cred + $1
                               WHERE id = $2 RETURNING tot_cred::int AS "totCred"`;

        const student = await client.query(updateStudent, [courseCredits, input.studentId]);
        if (student.rows.length === 0 ) {
          throw new Error(`No student with id ${input.studentId}`);
        }
        const newTotalCredits = student.rows[0].totCred;

        await client.query('COMMIT');
        return newTotalCredits;
    }catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }finally {
      client.release();
    }
}
