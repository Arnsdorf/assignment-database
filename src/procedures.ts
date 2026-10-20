import { pool } from './db.js';

export interface TranscriptRow {
  courseId: string;
  title: string;
  grade: string | null;
}

export async function transcriptOf(studentId: string): Promise<TranscriptRow[]> {
  const result = await pool.query<TranscriptRow>(
    `SELECT course_id AS "courseId", title, grade
     FROM student_transcript($1)`,
    [studentId]
  );
  return result.rows;
}

export async function transcriptOrUndefined(
  studentId: string): Promise<TranscriptRow[] | undefined> {
    try {
    return await transcriptOf(studentId);
  } catch (error) {
    if ((error as { code?: string; message?: string }).code === 'P0001' &&
        (error as { message?: string }).message === `No student with id ${studentId}`) { // kun vores egen "ingen student"-fejl
      return undefined;
    }
    throw error;
  }
}


export async function enrolWithProcedure(
  studentId: string, courseId: string, secId: string,
  semester: string, year: number): Promise<number> {
  const result = await pool.query( // kalder proceduren og får INOUT-resultatet tilbage
    'CALL enrol_student($1, $2, $3, $4, $5, NULL)',
    [studentId, courseId, secId, semester, year]
  );
  return Number(result.rows[0].new_total);
}
