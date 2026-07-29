import { Router } from 'express';
import { createGuest } from '../controllers/guestController';
import { getSelfInfo, updateSelfInfo } from '../controllers/userController';
import { authorizeRoles } from '../middleware/authorizeMiddleware';
import { authenticateToken } from '../middleware/authenticateMiddleware';

const router = Router();

router.post('/guests', createGuest);
router.get('/guests/me', authenticateToken, authorizeRoles('guest'), getSelfInfo);
router.patch('/guests/me', authenticateToken, authorizeRoles('guest'), updateSelfInfo);


export default router;

