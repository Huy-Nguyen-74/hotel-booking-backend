import { Router } from 'express';
import {
    createGuest,
    guestCreateBooking,
    cancelOwnBooking,
    guestViewAllBookingHistory,
    guestViewOneSpecificBooking,
    guestUpdateTheirOwnBooking
} from '../controllers/guestController';
import { getSelfInfo, updateSelfInfo } from '../controllers/userController';
import { authorizeRoles } from '../middleware/authorizeMiddleware';
import { authenticateToken } from '../middleware/authenticateMiddleware';


const router = Router();

router.post('/guests', createGuest);
router.get('/guests/me', authenticateToken, authorizeRoles('guest'), getSelfInfo);
router.get('/guests/bookings', authenticateToken, authorizeRoles('guest'), guestViewAllBookingHistory);
router.get('/guests/bookings/:bookingId', authenticateToken, authorizeRoles('guest'), guestViewOneSpecificBooking);
// Hotel routes for guests can be accessed without authenticating, using the shared hotel routes.
// Available rooms search route for guests can be accessed without authenticating, using the shared room routes.

router.post('/guests/bookings', authenticateToken, authorizeRoles('guest'), guestCreateBooking);
router.post('/guests/bookings/:bookingId/cancel', authenticateToken, authorizeRoles('guest'), cancelOwnBooking);

router.patch('/guests/bookings/:bookingId', authenticateToken, authorizeRoles('guest'), guestUpdateTheirOwnBooking);
router.patch('/guests/me', authenticateToken, authorizeRoles('guest'), updateSelfInfo);

export default router;

