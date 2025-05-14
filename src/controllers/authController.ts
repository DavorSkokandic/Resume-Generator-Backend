import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../models/db';
import {genToken} from '../utils/token';
import {sendEmail} from '../utils/mailer';

const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND = process.env.FRONTEND_URL!;

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const verifyToken = genToken();
    const user = await pool.query(
      "INSERT INTO users (email, password, verify_token) VALUES ($1, $2, $3) RETURNING id, email",
      [email, hashedPassword, verifyToken]
    );
    res.status(201).json({ 
      id: user.rows[0].id, 
      email: user.rows[0].email, //Added email to response
      message: "User registered successfully" //Added message
    });
     const verifyLink = `${FRONTEND}/verify-email?token=${verifyToken}`;
    await sendEmail(
      email,
      'Please verify your email',
      `Click <a href="${verifyLink}">here</a> to verify your account.`);
     res.status(201).json({ message: 'Registered. Check your email to verify.' });
  } catch (err: any) {
    //  Improved error handling: Check for specific PostgreSQL errors (e.g., duplicate email)
    if (err.code === '23505') { //  PostgreSQL error code for unique violation
      res.status(409).json({ error: 'Email already exists' }); // Conflict
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message }); // More general error
    }
  }
};


export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.query as { token?: string };
    if (!token) {
      res.status(400).json({ error: 'Missing token' });
      return;
    }

    const result = await pool.query(
      `UPDATE users
         SET is_verified = TRUE,
             verify_token = NULL
       WHERE verify_token = $1
       RETURNING id`,
      [token]
    );

    if (result.rowCount === 0) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    res.json({ message: 'Email verified! You can now log in.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/request-reset
 * Body { email }
 */
export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await pool.query(
      `SELECT id FROM users WHERE email = $1`,
      [email]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Email not found' });
      return;
    }

    const resetToken = genToken();
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now

    await pool.query(
      `UPDATE users
         SET reset_token = $1,
             reset_token_expires = $2
       WHERE email = $3`,
      [resetToken, expires, email]
    );

    const resetLink = `${FRONTEND}/reset-password?token=${resetToken}`;
    await sendEmail(
      email,
      'Your password reset link',
      `Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.`
    );

    res.json({ message: 'Password reset email sent.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 * Body { token, newPassword }
 */
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Missing token or new password' });
      return;
    }

    // Find matching, non-expired token
    const result = await pool.query(
      `SELECT id FROM users
         WHERE reset_token = $1
           AND reset_token_expires > NOW()`,
      [token]
    );

    if (result.rowCount === 0) {
      res.status(400).json({ error: 'Invalid or expired token' });
      return;
    }

    const userId = result.rows[0].id;
    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users
         SET password = $1,
             reset_token = NULL,
             reset_token_expires = NULL
       WHERE id = $2`,
      [hashed, userId]
    );

    res.json({ message: 'Password has been reset!' });
  } catch (err) {
    next(err);
  }
};

export const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      const user = result.rows[0];
      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }
      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: user.id, email: user.email } });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
