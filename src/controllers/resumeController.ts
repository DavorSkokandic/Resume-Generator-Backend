import { Request, Response } from 'express';
import * as ResumeModel from '../models/resumeModel';

export const createResume = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { title, content } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const resume = await ResumeModel.createResume({ user_id: userId, title, content });
    res.status(201).json(resume);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getResumes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resumes = await ResumeModel.getResumesByUser(userId);
    res.json(resumes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getResume = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resumeId = parseInt(req.params.id, 10);
    const resume = await ResumeModel.getResumeById(resumeId, userId);
    if (!resume) {
      res.status(404).json({ error: 'Resume not found' });
      return;
    }
    res.json(resume);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateResume = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resumeId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }
    const updatedResume = await ResumeModel.updateResume(resumeId, userId, title, content);
    if (!updatedResume) {
      res.status(404).json({ error: 'Resume not found or not authorized' });
      return;
    }
    res.json(updatedResume);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteResume = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const resumeId = parseInt(req.params.id, 10);
    await ResumeModel.deleteResume(resumeId, userId);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
