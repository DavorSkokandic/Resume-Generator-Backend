import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,

});

// Optional: Verify connection on startup
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  } catch (error) {
    console.error('❌ Error connecting to the database:', error);
  }
})();

export interface Resume {
  id?: number;
  user_id: number;
  title: string;
  content?: string;
  created_at?: Date;
  updated_at?: Date;
}

export const createResume = async (resume: Omit<Resume, 'id' | 'created_at' | 'updated_at'>) => {
  const { user_id, title, content } = resume;
  const result = await pool.query(
    `INSERT INTO created_resumes (user_id, title, content) VALUES ($1, $2, $3) RETURNING *`,
    [user_id, title, content]
  );
  return result.rows[0];
};

export const getResumesByUser = async (user_id: number) => {
  const result = await pool.query(
    `SELECT * FROM created_resumes WHERE user_id = $1 ORDER BY created_at DESC`,
    [user_id]
  );
  return result.rows;
};

export const getResumeById = async (id: number, user_id: number) => {
  const result = await pool.query(
    `SELECT * FROM created_resumes WHERE id = $1 AND user_id = $2`,
    [id, user_id]
  );
  return result.rows[0];
};

export const updateResume = async (
  id: number,
  user_id: number,
  title: string,
  content?: string
) => {
  const result = await pool.query(
    `UPDATE created_resumes SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *`,
    [title, content, id, user_id]
  );
  return result.rows[0];
};

export const deleteResume = async (id: number, user_id: number) => {
  await pool.query(`DELETE FROM created_resumes WHERE id = $1 AND user_id = $2`, [id, user_id]);
};
