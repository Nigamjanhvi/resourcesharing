const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const User = require('../models/User');
const Resource = require('../models/Resource');
const { Request } = require('../models/index');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { uploadFile } = require('../utils/cloudinary');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ─── GET /api/users/search ────────────────────────────────────────────────────
router.get('/search', authenticate, async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 1) {
      return res.json({ success: true, data: { users: [] } });
    }
    const regex = new RegExp(q, 'i');
    const users = await User.find({
      _id: { $ne: req.user._id },
      isActive: true,
      $or: [{ firstName: regex }, { lastName: regex }, { email: regex }],
    })
      .select('firstName lastName profilePicture university department')
      .limit(10);
    res.json({ success: true, data: { users } });
  } catch (err) {
    console.error('User search error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/users/dashboard ─────────────────────────────────────────────────
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user._id;

    const [myResources, sentRequests, receivedRequests] = await Promise.all([
      Resource.find({ postedBy: userId }).sort({ createdAt: -1 }).limit(20),
      Request.find({ requester: userId })
        .populate('resource', 'title images category')
        .populate('resourceOwner', 'firstName lastName')
        .sort({ createdAt: -1 })
        .limit(20),
      Request.find({ resourceOwner: userId })
        .populate('resource', 'title images category')
        .populate('requester', 'firstName lastName profilePicture')
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    const stats = {
      totalResources: myResources.length,
      activeResources: myResources.filter((r) => r.status === 'Available').length,
      pendingRequests: receivedRequests.filter((r) => r.status === 'Pending').length,
      completedExchanges: sentRequests.filter((r) => r.status === 'Completed').length,
    };

    res.json({
      success: true,
      data: { stats, myResources, sentRequests, receivedRequests },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/users/bookmarks ─────────────────────────────────────────────────
router.get('/bookmarks', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'bookmarks',
      populate: { path: 'postedBy', select: 'firstName lastName profilePicture university' },
    });

    res.json({
      success: true,
      data: { bookmarks: user.bookmarks || [] },
    });
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── GET /api/users/profile/:id ──────────────────────────────────────────────
router.get('/profile/:id', optionalAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      '-password -emailVerificationToken -passwordResetToken -passwordResetExpires'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const resources = await Resource.find({
      postedBy: req.params.id,
      status: { $ne: 'Removed' },
    })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({
      success: true,
      data: { user, resources },
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /api/users/profile ───────────────────────────────────────────────────
router.put(
  '/profile',
  authenticate,
  upload.single('avatar'),
  [
    body('firstName').optional().trim().notEmpty(),
    body('lastName').optional().trim().notEmpty(),
    body('bio').optional().isLength({ max: 300 }),
    body('university').optional().trim(),
    body('department').optional().trim(),
    body('year').optional().isInt({ min: 1, max: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const updates = {};
      const fields = ['firstName', 'lastName', 'bio', 'university', 'department', 'year', 'phone'];
      fields.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

      // Handle avatar upload
      if (req.file) {
        const result = await uploadFile(req.file.buffer, 'avatars');
        updates.profilePicture = result.secure_url;
      }

      const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updates },
        { new: true, runValidators: true }
      ).select('-password');

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user },
      });
    } catch (err) {
      console.error('Update profile error:', err);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
);

// ─── GET /api/users/notifications ────────────────────────────────────────────
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const { Notification } = require('../models/index');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      data: { notifications, unreadCount },
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUT /api/users/notifications/mark-read ──────────────────────────────────
router.put('/notifications/mark-read', authenticate, async (req, res) => {
  try {
    const { Notification } = require('../models/index');
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;