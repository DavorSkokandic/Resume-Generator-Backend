import express from 'express';
import { register, login , verifyEmail,
    requestPasswordReset, resetPassword
} from '../controllers/authController';
import { validate } from '../validator/validate';
//import { authenticate } from '../middleware/auth';
import { z } from 'zod';
import { registerSchema, loginSchema } from '../validator/authSchemas';

const router = express.Router();

router.post('/register',validate(registerSchema) ,register);
router.post('/login',validate(loginSchema) ,login);

router.get('/verify-email', verifyEmail);

router.post('/request-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

export default router;
