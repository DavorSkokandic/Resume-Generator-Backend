import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../models/db';

const JWT_SECRET = process.env.JWT_SECRET!; // Important: Make sure this is set!

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await pool.query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email",
      [email, hashedPassword]
    );
    res.status(201).json({ 
      id: user.rows[0].id, 
      email: user.rows[0].email, //Added email to response
      message: "User registered successfully" //Added message
    });
  } catch (err: any) {
    //  Improved error handling: Check for specific PostgreSQL errors (e.g., duplicate email)
    if (err.code === '23505') { //  PostgreSQL error code for unique violation
      res.status(409).json({ error: 'Email already exists' }); // Conflict
    } else {
      res.status(500).json({ error: 'Internal server error', details: err.message }); // More general error
    }
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
