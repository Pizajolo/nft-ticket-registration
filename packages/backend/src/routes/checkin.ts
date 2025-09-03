import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { requireAdminAuth } from '../middlewares/auth';
import { ValidationError, NotFoundError } from '../middlewares/errors';
import { getDatabase, saveDatabase } from '../db/init';

const router = Router();

// Validation schema
const ticketIdSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket ID')
});

// Check-in a ticket (admin only)
router.post('/:ticketId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { ticketId } = ticketIdSchema.parse(req.params);
    
    const db = getDatabase();
    
    // Find registration by ticket ID
    const registration = db.registrations.find(
      (reg: any) => reg.ticketId === ticketId
    );
    
    if (!registration) {
      throw new NotFoundError('Ticket not found');
    }
    
    // Check if already checked in
    if (registration.checkedInAt) {
      res.json({
        success: true,
        data: {
          message: 'Ticket already checked in',
          registration: {
            id: registration.id,
            ticketId: registration.ticketId,
            firstName: registration.firstName,
            lastName: registration.lastName,
            email: registration.email,
            checkedInAt: registration.checkedInAt,
            nft: registration.nft
          }
        }
      });
      return;
    }
    
    // Mark as checked in
    registration.checkedInAt = new Date().toISOString();
    
    // Save to database
    await saveDatabase();
    
    res.json({
      success: true,
      data: {
        message: 'Ticket checked in successfully',
        registration: {
          id: registration.id,
          ticketId: registration.ticketId,
          firstName: registration.firstName,
          lastName: registration.lastName,
          email: registration.email,
          checkedInAt: registration.checkedInAt,
          nft: registration.nft
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid ticket ID');
    }
    throw error;
  }
});

// Get ticket info for check-in (admin only)
router.get('/:ticketId', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const { ticketId } = ticketIdSchema.parse(req.params);
    
    const db = getDatabase();
    
    // Find registration by ticket ID
    const registration = db.registrations.find(
      (reg: any) => reg.ticketId === ticketId
    );
    
    if (!registration) {
      throw new NotFoundError('Ticket not found');
    }
    
    res.json({
      success: true,
      data: {
        id: registration.id,
        ticketId: registration.ticketId,
        firstName: registration.firstName,
        lastName: registration.lastName,
        email: registration.email,
        wallet: registration.wallet,
        nft: registration.nft,
        verifiedAt: registration.verifiedAt,
        checkedInAt: registration.checkedInAt,
        notes: registration.notes
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid ticket ID');
    }
    throw error;
  }
});

export default router;
