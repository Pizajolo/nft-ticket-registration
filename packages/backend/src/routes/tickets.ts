import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireUserAuth, requireAuth } from '../middlewares/auth';
import { ValidationError, NotFoundError } from '../middlewares/errors';
import { getDatabase } from '../db/init';

const router = Router();

// Validation schema
const ticketIdSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket ID')
});

// Get all tickets for session user
router.get('/', requireUserAuth, async (req: Request, res: Response) => {
  try {
    const sessionWallet = req.user!.wallet;
    const db = getDatabase();
    
    // Find registrations for this user
    const userRegistrations = db.registrations.filter(
      (reg: any) => reg.wallet.toLowerCase() === sessionWallet.toLowerCase()
    );
    
    const tickets = userRegistrations.map((reg: any) => ({
      id: reg.ticketId,
      registrationId: reg.id,
      nft: reg.nft,
      firstName: reg.firstName,
      lastName: reg.lastName,
      email: reg.email,
      verifiedAt: reg.verifiedAt,
      checkedInAt: reg.checkedInAt,
      qr: reg.qr
    }));
    
    res.json({
      success: true,
      data: {
        tickets,
        total: tickets.length
      }
    });
  } catch (error) {
    throw error;
  }
});

// Get specific ticket (user must own it or be admin)
router.get('/:ticketId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { ticketId } = ticketIdSchema.parse(req.params);
    const sessionWallet = req.user!.wallet;
    const isAdmin = req.user!.type === 'admin';
    
    const db = getDatabase();
    
    // Find registration by ticket ID
    const registration = db.registrations.find(
      (reg: any) => reg.ticketId === ticketId
    );
    
    if (!registration) {
      throw new NotFoundError('Ticket not found');
    }
    
    // Check authorization: user must own ticket or be admin
    if (!isAdmin && registration.wallet.toLowerCase() !== sessionWallet.toLowerCase()) {
      throw new NotFoundError('Ticket not found'); // Don't reveal existence
    }
    
    const ticket = {
      id: registration.ticketId,
      registrationId: registration.id,
      nft: registration.nft,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      verifiedAt: registration.verifiedAt,
      checkedInAt: registration.checkedInAt,
      qr: registration.qr,
      notes: registration.notes
    };
    
    res.json({
      success: true,
      data: ticket
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid ticket ID');
    }
    throw error;
  }
});

export default router;
