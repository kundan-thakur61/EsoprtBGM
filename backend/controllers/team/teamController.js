const asyncHandler = require('express-async-handler');
const Team = require('../../models/Team');
const User = require('../../models/User');

// Create a new team
const createTeam = asyncHandler(async (req, res) => {
  const { teamName, game, description } = req.body;
  
  const team = new Team({
    teamName,
    game,
    description,
    captain: req.user._id,
    players: [{ user: req.user._id, role: 'captain' }]
  });
  
  await team.save();
  
  res.status(201).json({
    success: true,
    data: { team }
  });
});

// Get all teams
const getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find()
    .populate('captain', 'username email')
    .populate('players.user', 'username email')
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: { teams }
  });
});

// Get team by ID
const getTeamById = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id)
    .populate('captain', 'username email')
    .populate('players.user', 'username email');
  
  if (!team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  res.json({
    success: true,
    data: { team }
  });
});

// Update team
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  if (team.captain.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this team'
    });
  }
  
  const { teamName, game, description } = req.body;
  
  if (teamName) team.teamName = teamName;
  if (game) team.game = game;
  if (description) team.description = description;
  
  await team.save();
  
  res.json({
    success: true,
    data: { team }
  });
});

// Delete team
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  if (team.captain.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this team'
    });
  }
  
  await team.remove();
  
  res.json({
    success: true,
    message: 'Team deleted successfully'
  });
});

// Add team member
const addTeamMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;
  
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  if (team.captain.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to add members to this team'
    });
  }
  
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  
  const isMember = team.players.some(player => player.user.toString() === userId);
  if (isMember) {
    return res.status(400).json({
      success: false,
      message: 'User is already a member of this team'
    });
  }
  
  team.players.push({ user: userId, role });
  await team.save();
  
  res.json({
    success: true,
    message: 'Member added successfully',
    data: { team }
  });
});

// Remove team member
const removeTeamMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.id);
  
  if (!team) {
    return res.status(404).json({
      success: false,
      message: 'Team not found'
    });
  }
  
  if (team.captain.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to remove members from this team'
    });
  }
  
  team.players = team.players.filter(
    player => player.user.toString() !== req.params.userId
  );
  
  await team.save();
  
  res.json({
    success: true,
    message: 'Member removed successfully'
  });
});

module.exports = {
  createTeam,
  getTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember
};
