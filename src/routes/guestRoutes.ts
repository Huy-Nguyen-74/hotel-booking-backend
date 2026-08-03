import { Router } from 'express';
import { createGuest, guestCreateBooking } from '../controllers/guestController';
import { getSelfInfo, updateSelfInfo } from '../controllers/userController';
import { getHotels } from '../controllers/hotelController';
import { authorizeRoles } from '../middleware/authorizeMiddleware';
import { authenticateToken } from '../middleware/authenticateMiddleware';


const router = Router();

router.post('/guests', createGuest);
router.post('/guests/bookings', authenticateToken, authorizeRoles('guest'), guestCreateBooking);
router.get('/guests/me', authenticateToken, authorizeRoles('guest'), getSelfInfo);
// Hotel routes for guests can be accessed without authenticating, using the shared hotel routes.
// Available rooms search route for guests can be accessed without authenticating, using the shared room routes.
router.patch('/guests/me', authenticateToken, authorizeRoles('guest'), updateSelfInfo);

export default router;

