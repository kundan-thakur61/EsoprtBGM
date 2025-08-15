const asyncHandler = require('express-async-handler');
const User = require('../../models/User');
const Tournament = require('../../models/Tournament');
const Match = require('../../models/Match');

// Get admin dashboard stats
exports.getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const stats = {
      totalUsers: await User.countDocuments() || 0,
      totalTournaments: await Tournament.countDocuments() || 0,
      activeTournaments: await Tournament.countDocuments({ status: 'ongoing' }) || 0,
      pendingMatches: await Match.countDocuments({ status: 'pending' }) || 0,
      recentUsers: await User.find().sort({ createdAt: -1 }).limit(5).select('username email createdAt') || [],
      recentTournaments: await Tournament.find().sort({ createdAt: -1 }).limit(5).select('name status startDate') || []
    };

    res.json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: 0,
          totalTournaments: 0,
          activeTournaments: 0,
          pendingMatches: 0,
          recentUsers: [],
          recentTournaments: []
        }
      }
    });
  }
});

// Get all users for admin management
exports.getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, status } = req.query;

  try {
    const filter = {};
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) filter.status = status;

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { users: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
    });
  }
});

// Update user status (ban/unban)
exports.updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status, reason } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { status, banReason: reason },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${status === 'banned' ? 'banned' : 'unbanned'} successfully`,
      data: { user }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user status'
    });
  }
});

// Delete user
exports.deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findByIdAndDelete(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// Get all tournaments for admin management
exports.getAllTournaments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  try {
    const filter = {};
    if (status) filter.status = status;

    const tournaments = await Tournament.find(filter)
      .populate('createdBy', 'username email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Tournament.countDocuments(filter);

    res.json({
      success: true,
      data: {
        tournaments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.json({
      success: true,
      data: { tournaments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
    });
  }
});

// System settings
exports.getSystemSettings = asyncHandler(async (req, res) => {
  // Mock system settings - replace with actual settings from database
  const settings = {
    siteName: 'Esports Platform',
    maintenanceMode: false,
    allowRegistration: true,
    maxTournamentSize: 1024,
    supportedGames: ['valorant', 'csgo', 'lol', 'dota2', 'pubg'],
    paymentMethods: ['razorpay', 'stripe']
  };

  res.json({
    success: true,
    data: { settings }
  });
});

// Update system settings
exports.updateSystemSettings = asyncHandler(async (req, res) => {
  const settings = req.body;

  // Mock update - replace with actual database update
  console.log('Updating system settings:', settings);

  res.json({
    success: true,
    message: 'System settings updated successfully',
    data: { settings }
  });
});
