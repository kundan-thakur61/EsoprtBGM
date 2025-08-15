const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: [true, 'Team name is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Team name must be at least 3 characters'],
    maxlength: [50, 'Team name cannot exceed 50 characters'],
    match: [/^[a-zA-Z0-9\s_-]+$/, 'Team name can only contain letters, numbers, spaces, underscores and hyphens']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  logo: {
    url: String,
    publicId: String
  },
  players: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    role: {
      type: String,
      enum: ['member', 'vice_captain'],
      default: 'member'
    }
  }],
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  substitutes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  invitations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined', 'expired'],
      default: 'pending'
    },
    message: String
  }],
  stats: {
    matchesPlayed: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    draws: {
      type: Number,
      default: 0
    },
    points: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    ranking: {
      type: Number,
      default: null
    },
    streak: {
      current: {
        type: Number,
        default: 0
      },
      type: {
        type: String,
        enum: ['win', 'loss', 'draw'],
        default: 'draw'
      },
      best: {
        wins: {
          type: Number,
          default: 0
        },
        losses: {
          type: Number,
          default: 0
        }
      }
    }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['tournament_winner', 'tournament_runner_up', 'tournament_participant', 'win_streak', 'milestone'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: String,
    tournament: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tournament'
    },
    achievedAt: {
      type: Date,
      default: Date.now
    },
    metadata: mongoose.Schema.Types.Mixed
  }],
  settings: {
    privacy: {
      publicProfile: {
        type: Boolean,
        default: true
      },
      showStats: {
        type: Boolean,
        default: true
      },
      allowInvitations: {
        type: Boolean,
        default: true
      }
    },
    recruitment: {
      isRecruiting: {
        type: Boolean,
        default: false
      },
      requirements: {
        minRank: String,
        minExperience: String,
        preferredRoles: [String],
        description: String
      }
    }
  },
  social: {
    website: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Website must be a valid URL'
      }
    },
    discord: String,
    twitter: String,
    twitch: String,
    youtube: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'disbanded', 'suspended'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
TeamSchema.index({ teamName: 1 });
TeamSchema.index({ slug: 1 });
TeamSchema.index({ captain: 1 });
TeamSchema.index({ 'players.user': 1 });
TeamSchema.index({ status: 1, isVerified: 1 });
TeamSchema.index({ 'stats.points': -1 });
TeamSchema.index({ 'stats.ranking': 1 });
TeamSchema.index({ createdAt: -1 });

// Virtual fields
TeamSchema.virtual('playerCount').get(function() {
  return this.players ? this.players.filter(p => p.status === 'active').length : 0;
});

TeamSchema.virtual('isComplete').get(function() {
  return this.playerCount === 4;
});

TeamSchema.virtual('needsPlayers').get(function() {
  return 4 - this.playerCount;
});

TeamSchema.virtual('averagePlayerLevel').get(function() {
  // This would need to be populated with player stats
  return 0;
});

// Generate slug before save
TeamSchema.pre('save', function(next) {
  if (this.isModified('teamName')) {
    this.slug = this.teamName
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .replace(/\s+/g, '-');
  }
  
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  
  next();
});

// Validate team has exactly 4 active players
TeamSchema.pre('save', function(next) {
  const activePlayers = this.players.filter(p => p.status === 'active');
  if (activePlayers.length > 4) {
    next(new Error('A team cannot have more than 4 active players'));
  } else {
    next();
  }
});

// Calculate win rate
TeamSchema.pre('save', function(next) {
  if (this.stats.matchesPlayed > 0) {
    this.stats.winRate = Math.round((this.stats.wins / this.stats.matchesPlayed) * 100);
  }
  next();
});

// Instance methods
TeamSchema.methods.addPlayer = function(userId, role = 'member') {
  const activePlayers = this.players.filter(p => p.status === 'active');
  if (activePlayers.length >= 4) {
    throw new Error('Team is already full');
  }
  
  // Check if user is already in team
  const existingPlayer = this.players.find(p => p.user.toString() === userId.toString());
  if (existingPlayer) {
    if (existingPlayer.status === 'inactive' || existingPlayer.status === 'suspended') {
      existingPlayer.status = 'active';
      existingPlayer.joinedAt = Date.now();
    } else {
      throw new Error('User is already a member of this team');
    }
  } else {
    this.players.push({
      user: userId,
      role: role,
      status: 'active'
    });
  }
  
  return this;
};

TeamSchema.methods.removePlayer = function(userId) {
  this.players = this.players.filter(p => p.user.toString() !== userId.toString());
  return this;
};

TeamSchema.methods.updatePlayerStatus = function(userId, status) {
  const player = this.players.find(p => p.user.toString() === userId.toString());
  if (player) {
    player.status = status;
  }
  return this;
};

TeamSchema.methods.transferCaptaincy = function(newCaptainId) {
  const newCaptain = this.players.find(p => p.user.toString() === newCaptainId.toString());
  if (!newCaptain || newCaptain.status !== 'active') {
    throw new Error('New captain must be an active team member');
  }
  
  this.captain = newCaptainId;
  return this;
};

TeamSchema.methods.invitePlayer = function(userId, invitedBy, message = '') {
  // Check if invitation already exists
  const existingInvite = this.invitations.find(
    inv => inv.user.toString() === userId.toString() && 
           inv.status === 'pending' && 
           inv.expiresAt > new Date()
  );
  
  if (existingInvite) {
    throw new Error('Invitation already sent to this user');
  }
  
  this.invitations.push({
    user: userId,
    invitedBy,
    message,
    status: 'pending'
  });
  
  return this;
};

TeamSchema.methods.respondToInvitation = function(userId, response) {
  const invitation = this.invitations.find(
    inv => inv.user.toString() === userId.toString() && 
           inv.status === 'pending' && 
           inv.expiresAt > new Date()
  );
  
  if (!invitation) {
    throw new Error('No valid invitation found');
  }
  
  invitation.status = response;
  
  if (response === 'accepted') {
    this.addPlayer(userId);
  }
  
  return this;
};

TeamSchema.methods.updateMatchStats = function(result) {
  this.stats.matchesPlayed += 1;
  
  switch (result) {
    case 'win':
      this.stats.wins += 1;
      this.stats.points += 3;
      this.updateStreak('win');
      break;
    case 'loss':
      this.stats.losses += 1;
      this.updateStreak('loss');
      break;
    case 'draw':
      this.stats.draws += 1;
      this.stats.points += 1;
      this.updateStreak('draw');
      break;
  }
  
  // Recalculate win rate
  this.stats.winRate = Math.round((this.stats.wins / this.stats.matchesPlayed) * 100);
  
  return this;
};

TeamSchema.methods.updateStreak = function(result) {
  if (this.stats.streak.type === result) {
    this.stats.streak.current += 1;
  } else {
    this.stats.streak.current = 1;
    this.stats.streak.type = result;
  }
  
  // Update best streaks
  if (result === 'win' && this.stats.streak.current > this.stats.streak.best.wins) {
    this.stats.streak.best.wins = this.stats.streak.current;
  } else if (result === 'loss' && this.stats.streak.current > this.stats.streak.best.losses) {
    this.stats.streak.best.losses = this.stats.streak.current;
  }
};

TeamSchema.methods.addAchievement = function(type, title, description, metadata = {}) {
  this.achievements.push({
    type,
    title,
    description,
    metadata,
    achievedAt: new Date()
  });
  return this;
};

// Static methods
TeamSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase() });
};

TeamSchema.statics.findTeamsByPlayer = function(userId) {
  return this.find({ 
    'players.user': userId,
    'players.status': 'active'
  });
};

TeamSchema.statics.getTopTeams = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.points': -1, 'stats.winRate': -1 })
    .limit(limit)
    .populate('captain', 'username')
    .populate('players.user', 'username');
};

TeamSchema.statics.searchTeams = function(query, filters = {}) {
  const searchQuery = {
    status: 'active',
    ...filters
  };
  
  if (query) {
    searchQuery.$or = [
      { teamName: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }
  
  return this.find(searchQuery)
    .populate('captain', 'username')
    .populate('players.user', 'username')
    .sort({ 'stats.points': -1 });
};

module.exports = mongoose.model('Team', TeamSchema);