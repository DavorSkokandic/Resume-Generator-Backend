import express from 'express';
import * as ResumeController from '../controllers/resumeController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticate);

router.post('/', ResumeController.createResume);
router.get('/', ResumeController.getResumes);
router.get('/:id', ResumeController.getResume);
router.put('/:id', ResumeController.updateResume);
router.delete('/:id', ResumeController.deleteResume);

export default router;
