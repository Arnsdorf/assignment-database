import { pool } from './db.js';

export interface EnrolInput {
  studentId: string;
  courseId: string;
  secId: string;
  semester: string;
  year: number;
}

export async function enrolInTypeScript(input: EnrolInput): Promise<number> {
   const client = await pool.connect(); // samme forbindelse til hele transaktionen

  try { // hvis noget her fejler, ryger vi i catch
    await client.query('BEGIN'); // starter transaktionen

    await client.query(
      `INSERT INTO takes (id, course_id, sec_id, semester, year, grade)
       VALUES ($1, $2, $3, $4, $5, NULL)`,
      [input.studentId, input.courseId, input.secId, input.semester, input.year]
    );

    const result = await client.query(
      `UPDATE student
       SET tot_cred = tot_cred +
         (SELECT credits FROM course WHERE course_id = $2)
       WHERE id = $1
       RETURNING tot_cred`,
      [input.studentId, input.courseId]
    );

    await client.query('COMMIT'); // gemmer begge ændringer samlet
    return Number(result.rows[0].tot_cred); // laver ECTS-tallet om til et tal

  } catch (error) {
    await client.query('ROLLBACK'); // fortryder ændringerne ved fejl
    throw error;
  } finally {
    client.release(); // frigiver forbindelsen, også ved fejl
  }
}
