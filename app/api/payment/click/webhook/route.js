import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserById, updateUser, getBookById, addOrder } from '@/lib/db';

function md5(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

export async function POST(request) {
  try {
    let body = {};
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        body[key] = value;
      }
    }

    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      amount,
      action,
      error,
      error_note,
      sign_time,
      sign_string
    } = body;

    // 1. Signature Verification
    const secretKey = process.env.CLICK_SECRET_KEY || 'click-secret-key-2025';
    let signStringCalculated;
    
    if (Number(action) === 0) {
      signStringCalculated = md5(
        click_trans_id + service_id + secretKey + merchant_trans_id + amount + action + sign_time
      );
    } else {
      signStringCalculated = md5(
        click_trans_id + service_id + secretKey + merchant_trans_id + click_paydoc_id + amount + action + sign_time
      );
    }

    if (sign_string !== signStringCalculated) {
      return NextResponse.json({
        error: -1,
        error_note: 'Signature mismatch'
      });
    }

    // 2. Determine and parse transaction type
    const isBook = merchant_trans_id.startsWith('book_');
    let userId, months, bookId, distance;

    if (isBook) {
      const match = merchant_trans_id.match(/book_u(\d+)_b(\d+)_d(\d+)_t/);
      if (!match) {
        return NextResponse.json({ error: -3, error_note: 'Invalid transaction parameter' });
      }
      userId = match[1];
      bookId = match[2];
      distance = Number(match[3]);
    } else {
      const match = merchant_trans_id.match(/premium_u(\d+)_m(\d+)_t/);
      if (!match) {
        return NextResponse.json({ error: -3, error_note: 'Invalid transaction parameter' });
      }
      userId = match[1];
      months = Number(match[2]);
    }

    // 3. Verify user exists
    const user = getUserById(userId);
    if (!user) {
      return NextResponse.json({
        error: -5,
        error_note: 'User not found'
      });
    }

    // 4. Verify book exists and compute amount
    let expectedAmount = 0;
    let book = null;

    if (isBook) {
      book = getBookById(bookId);
      if (!book) {
        return NextResponse.json({
          error: -5,
          error_note: 'Book not found'
        });
      }
      const basePrice = user.isPremium ? Math.round(book.price * 0.8) : book.price;
      const deliveryFee = distance * 5000;
      expectedAmount = basePrice + deliveryFee;
    } else {
      const prices = {
        1: 20000,
        3: 80000,
        9: 200000
      };
      expectedAmount = prices[months];
    }

    if (Number(amount) !== expectedAmount) {
      return NextResponse.json({
        error: -2,
        error_note: `Incorrect amount. Expected: ${expectedAmount}, Got: ${amount}`
      });
    }

    // 5. Check if Click reported an error
    if (Number(error) < 0) {
      return NextResponse.json({
        error: -9,
        error_note: error_note || 'Transaction failed in Click'
      });
    }

    // 6. Action Handlers
    if (Number(action) === 0) {
      // PREPARE
      return NextResponse.json({
        click_trans_id: Number(click_trans_id),
        merchant_trans_id: merchant_trans_id,
        merchant_prepare_id: `prep_${click_trans_id}`,
        error: 0,
        error_note: 'Prepare success'
      });
    } else if (Number(action) === 1) {
      // COMPLETE
      if (isBook) {
        // Record the book order in DB
        const basePrice = user.isPremium ? Math.round(book.price * 0.8) : book.price;
        const deliveryFee = distance * 5000;
        
        addOrder({
          userId,
          bookId,
          bookTitle: book.title,
          price: basePrice + deliveryFee,
          userName: user.name,
          userPhone: user.phone,
          distance,
          deliveryFee,
          address: 'Click delivery address (specified on payment)'
        });
      } else {
        // Process Premium subscription update
        let newExpiry;
        const now = new Date();

        if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
          newExpiry = new Date(user.premiumExpiresAt);
          newExpiry.setMonth(newExpiry.getMonth() + months);
        } else {
          newExpiry = new Date(now);
          newExpiry.setMonth(newExpiry.getMonth() + months);
        }

        updateUser(userId, {
          isPremium: true,
          premiumExpiresAt: newExpiry.toISOString()
        });
      }

      return NextResponse.json({
        click_trans_id: Number(click_trans_id),
        merchant_trans_id: merchant_trans_id,
        merchant_confirm_id: `conf_${click_trans_id}`,
        error: 0,
        error_note: 'Complete success'
      });
    }

    return NextResponse.json({
      error: -4,
      error_note: 'Action not supported'
    });
  } catch (err) {
    console.error('Click Webhook Error:', err);
    return NextResponse.json({
      error: -9,
      error_note: 'Internal server error'
    });
  }
}
