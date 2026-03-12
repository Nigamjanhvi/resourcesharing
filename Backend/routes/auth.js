const express = require('express');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const { generateToken, generateRefreshToken, authenticate } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

// Validation rules
const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required').isLength({ max: 50 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required').isLength({ max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('university').trim().notEmpty().withMessage('University is required'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// POST /api/auth/register
router.post('/register', registerValidation, async (req, res, next) => {
  console.log('📝 Registration attempt:', req.body.email);
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { firstName, lastName, email, password, university, department, year } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    // Create user
    console.log('💾 Creating user in DB...');
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      university,
      department,
      year,
    });
    console.log('✅ User created:', user._id);

    // Generate email verification token
    console.log('🔑 Generating verification token...');
    const verificationToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });
    console.log('✅ Token saved to user');

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Remove password from response
    user.password = undefined;

    // Send response IMMEDIATELY — don't wait for email
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: { user, token, refreshToken },
    });

    // Send verification email in background (fire-and-forget)
    sendVerificationEmail(user.email, user.firstName, verificationToken)
      .then(() => console.log('✅ Verification email sent to', user.email))
      .catch((emailError) => console.error('❌ Email sending failed (non-blocking):', emailError.message));
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', loginValidation, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // Include password in this query
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.',
      });
    }

    // Update last seen
    await User.findByIdAndUpdate(user._id, { lastSeen: new Date() });

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.password = undefined;

    res.json({
      success: true,
      message: 'Login successful.',
      data: { user, token, refreshToken },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/verify-email/:token
router.post('/verify-email/:token', async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired.',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully!' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});

// POST /api/auth/refresh-token
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token required.' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newToken = generateToken(user._id);
    res.json({ success: true, data: { token: newToken } });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }
    next(error);
  }
});

module.exports = router;
