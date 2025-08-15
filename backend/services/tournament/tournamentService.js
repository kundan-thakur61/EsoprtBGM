const Tournament = require('../../models/Tournament');
const Team = require('../../models/Team');
const User = require('../../models/User');
const Match = require('../../models/Match');
const Bracket = require('../../models/Bracket');
const logger = require('../../utils/logger/logger');
const redisClient = require('../../config/redis');
const { sendEmail } = require('../notification/emailService');
const { createNotification } = require('../notification/notificationService');

class TournamentService {
  // Create tournament with validation
  async createTournament(tournamentData, creatorId) {
    try {
      // Validate dates
      const startDate = new Date(tournamentData.startDate);
      const endDate = new Date(tournamentData.endDate);
      const now = new Date();

      if (startDate <= now) {
        throw new Error('Start date must be in the future');
      }

      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Create tournament
      const tournament = new Tournament({
        ...tournamentData,
        createdBy: creatorId,
        registrationDeadline: tournamentData.registrationDeadline || 
          new Date(startDate.getTime() - 24 * 60 * 60 * 1000), // 24 hours before start
        status: 'upcoming'
      });

      await tournament.save();

      // Create tournament bracket structure
      if (tournament.format === 'single_elimination' || tournament.format === 'double_elimination') {
        await this.generateBracket(tournament._id, tournament.format);
      }

      // Cache tournament data
      await redisClient.set(`tournament:${tournament._id}`, tournament, 3600);

      logger.info('Tournament created', {
        tournamentId: tournament._id,
        name: tournament.name,
        creatorId
      });

      return tournament;
    } catch (error) {
      logger.error('Create tournament error:', error);
      throw error;
    }
  }

  // Generate tournament bracket
  async generateBracket(tournamentId, format) {
    try {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      const participantCount = tournament.participants.length;
      const rounds = Math.ceil(Math.log2(participantCount));

      const bracket = new Bracket({
        tournament: tournamentId,
        format,
        rounds,
        matches: []
      });

      // Generate bracket structure based on format
      if (format === 'single_elimination') {
        bracket.matches = this.generateSingleEliminationMatches(tournament.participants, rounds);
      } else if (format === 'double_elimination') {
        bracket.matches = this.generateDoubleEliminationMatches(tournament.participants, rounds);
      } else if (format === 'round_robin') {
        bracket.matches = this.generateRoundRobinMatches(tournament.participants);
      }

      await bracket.save();

      // Update tournament with bracket reference
      tournament.bracket = bracket._id;
      await tournament.save();

      logger.info('Tournament bracket generated', {
        tournamentId,
        format,
        rounds,
        matchCount: bracket.matches.length
      });

      return bracket;
    } catch (error) {
      logger.error('Generate bracket error:', error);
      throw error;
    }
  }

  // Register team for tournament
  async registerTeam(tournamentId, teamId, userId) {
    try {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Check registration deadline
      if (tournament.registrationDeadline && new Date() > tournament.registrationDeadline) {
        throw new Error('Registration deadline has passed');
      }

      // Check if tournament is full
      if (tournament.maxParticipants && 
          tournament.participants.length >= tournament.maxParticipants) {
        throw new Error('Tournament is full');
      }

      // Check if team is already registered
      if (tournament.participants.includes(teamId)) {
        throw new Error('Team is already registered for this tournament');
      }

      // Verify team exists and user is captain
      const team = await Team.findById(teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      if (team.captain.toString() !== userId.toString()) {
        throw new Error('Only team captain can register for tournaments');
      }

      // Check if team meets requirements
      if (tournament.teamRequirements) {
        await this.validateTeamRequirements(team, tournament.teamRequirements);
      }

      // Handle entry fee
      if (tournament.entryFee > 0) {
        await this.processEntryFee(userId, tournament.entryFee, tournamentId);
      }

      // Register team
      tournament.participants.push(teamId);
      await tournament.save();

      // Create registration record
      const Registration = require('../../models/Registration');
      const registration = new Registration({
        tournament: tournamentId,
        team: teamId,
        registeredBy: userId,
        registrationDate: new Date(),
        status: 'confirmed',
        entryFeePaid: tournament.entryFee > 0
      });
      await registration.save();

      // Send confirmation notifications
      await this.sendRegistrationConfirmation(team, tournament);

      // Update cache
      await redisClient.del(`tournament:${tournamentId}`);

      logger.info('Team registered for tournament', {
        tournamentId,
        teamId,
        userId
      });

      return registration;
    } catch (error) {
      logger.error('Team registration error:', error);
      throw error;
    }
  }

  // Start tournament
  async startTournament(tournamentId, adminId) {
    try {
      const tournament = await Tournament.findById(tournamentId)
        .populate('participants', 'teamName players');

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      if (tournament.status !== 'upcoming') {
        throw new Error('Tournament cannot be started');
      }

      if (tournament.participants.length < tournament.minParticipants) {
        throw new Error('Not enough participants to start tournament');
      }

      // Generate or update bracket with actual participants
      if (tournament.bracket) {
        await this.updateBracketWithParticipants(tournament.bracket, tournament.participants);
      } else {
        await this.generateBracket(tournamentId, tournament.format || 'single_elimination');
      }

      // Update tournament status
      tournament.status = 'ongoing';
      tournament.actualStartDate = new Date();
      await tournament.save();

      // Create first round matches
      await this.createFirstRoundMatches(tournamentId);

      // Send notifications to participants
      await this.notifyTournamentStart(tournament);

      logger.info('Tournament started', {
        tournamentId,
        participantCount: tournament.participants.length,
        adminId
      });

      return tournament;
    } catch (error) {
      logger.error('Start tournament error:', error);
      throw error;
    }
  }

  // Process match result and advance bracket
  async processMatchResult(matchId, result, adminId) {
    try {
      const match = await Match.findById(matchId)
        .populate('tournament')
        .populate('teams');

      if (!match) {
        throw new Error('Match not found');
      }

      if (match.status === 'completed') {
        throw new Error('Match is already completed');
      }

      // Validate result
      if (!result.winner || !result.scores) {
        throw new Error('Invalid match result');
      }

      // Update match
      match.result = result;
      match.status = 'completed';
      match.completedAt = new Date();
      match.completedBy = adminId;
      await match.save();

      // Update team stats
      await this.updateTeamStats(match.teams, result);

      // Advance winner in bracket
      await this.advanceBracket(match.tournament._id, matchId, result.winner);

      // Check if tournament is complete
      await this.checkTournamentCompletion(match.tournament._id);

      logger.info('Match result processed', {
        matchId,
        winnerId: result.winner,
        adminId
      });

      return match;
    } catch (error) {
      logger.error('Process match result error:', error);
      throw error;
    }
  }

  // Get tournament standings
  async getTournamentStandings(tournamentId) {
    try {
      const cacheKey = `standings:${tournamentId}`;
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        return cached;
      }

      const tournament = await Tournament.findById(tournamentId)
        .populate({
          path: 'participants',
          populate: {
            path: 'players',
            select: 'username'
          }
        });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      let standings;

      if (tournament.format === 'round_robin') {
        standings = await this.calculateRoundRobinStandings(tournamentId);
      } else {
        standings = await this.calculateEliminationStandings(tournamentId);
      }

      // Cache for 5 minutes
      await redisClient.set(cacheKey, standings, 300);

      return standings;
    } catch (error) {
      logger.error('Get tournament standings error:', error);
      throw error;
    }
  }

  // Private helper methods
  generateSingleEliminationMatches(participants, rounds) {
    const matches = [];
    const totalMatches = participants.length - 1;
    
    let currentRoundParticipants = [...participants];
    
    for (let round = 1; round <= rounds; round++) {
      const roundMatches = [];
      const nextRoundParticipants = [];
      
      for (let i = 0; i < currentRoundParticipants.length; i += 2) {
        const match = {
          round,
          teams: [currentRoundParticipants[i], currentRoundParticipants[i + 1]].filter(Boolean),
          status: 'pending',
          scheduledDate: null
        };
        
        roundMatches.push(match);
        nextRoundParticipants.push(null); // Winner will be determined
      }
      
      matches.push(...roundMatches);
      currentRoundParticipants = nextRoundParticipants;
    }
    
    return matches;
  }

  generateDoubleEliminationMatches(participants, rounds) {
    // Double elimination logic - more complex bracket generation
    const matches = [];
    
    // Winners bracket
    const winnersMatches = this.generateSingleEliminationMatches(participants, rounds);
    winnersMatches.forEach(match => {
      match.bracket = 'winners';
      matches.push(match);
    });
    
    // Losers bracket - for eliminated teams from winners bracket
    const losersRounds = (rounds - 1) * 2;
    for (let round = 1; round <= losersRounds; round++) {
      matches.push({
        round,
        bracket: 'losers',
        teams: [],
        status: 'pending',
        scheduledDate: null
      });
    }
    
    // Grand final
    matches.push({
      round: rounds + 1,
      bracket: 'grand_final',
      teams: [],
      status: 'pending',
      scheduledDate: null
    });
    
    return matches;
  }

  generateRoundRobinMatches(participants) {
    const matches = [];
    
    for (let i = 0; i < participants.length; i++) {
      for (let j = i + 1; j < participants.length; j++) {
        matches.push({
          round: 1,
          teams: [participants[i], participants[j]],
          status: 'pending',
          scheduledDate: null
        });
      }
    }
    
    return matches;
  }

  async validateTeamRequirements(team, requirements) {
    if (requirements.minRank && team.stats.ranking < requirements.minRank) {
      throw new Error(`Team rank must be at least ${requirements.minRank}`);
    }
    
    if (requirements.minMatches && team.stats.matchesPlayed < requirements.minMatches) {
      throw new Error(`Team must have played at least ${requirements.minMatches} matches`);
    }
    
    if (requirements.region && team.region !== requirements.region) {
      throw new Error(`Tournament is restricted to ${requirements.region} region`);
    }
  }

  async processEntryFee(userId, amount, tournamentId) {
    // Integration with payment service
    const paymentService = require('../payment/paymentService');
    
    try {
      await paymentService.processPayment({
        userId,
        amount,
        currency: 'INR',
        description: `Tournament entry fee - ${tournamentId}`,
        metadata: { tournamentId }
      });
    } catch (error) {
      throw new Error('Entry fee payment failed');
    }
  }

  async sendRegistrationConfirmation(team, tournament) {
    try {
      const captain = await User.findById(team.captain);
      
      await sendEmail({
        to: captain.email,
        subject: `Tournament Registration Confirmed - ${tournament.name}`,
        template: 'tournament-registration',
        data: {
          captainName: captain.username,
          teamName: team.teamName,
          tournamentName: tournament.name,
          startDate: tournament.startDate,
          entryFee: tournament.entryFee
        }
      });

      // Notify all team members
      for (const player of team.players) {
        await createNotification({
          userId: player.user,
          type: 'tournament_registration',
          title: 'Tournament Registration',
          message: `Your team ${team.teamName} has been registered for ${tournament.name}`,
          data: { tournamentId: tournament._id, teamId: team._id }
        });
      }
    } catch (error) {
      logger.error('Send registration confirmation error:', error);
    }
  }

  async updateTeamStats(teams, result) {
    try {
      const winner = await Team.findById(result.winner);
      const loser = teams.find(team => team._id.toString() !== result.winner.toString());
      
      if (winner) {
        winner.stats.matchesPlayed += 1;
        winner.stats.wins += 1;
        winner.stats.points += 3;
        await winner.save();
      }
      
      if (loser) {
        loser.stats.matchesPlayed += 1;
        loser.stats.losses += 1;
        await loser.save();
      }
    } catch (error) {
      logger.error('Update team stats error:', error);
    }
  }

  async calculateRoundRobinStandings(tournamentId) {
    const matches = await Match.find({ 
      tournament: tournamentId,
      status: 'completed'
    }).populate('teams');
    
    const standings = new Map();
    
    // Initialize standings
    const tournament = await Tournament.findById(tournamentId).populate('participants');
    tournament.participants.forEach(team => {
      standings.set(team._id.toString(), {
        team,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        matchesPlayed: 0
      });
    });
    
    // Calculate standings from matches
    matches.forEach(match => {
      const result = match.result;
      match.teams.forEach(team => {
        const teamStats = standings.get(team._id.toString());
        teamStats.matchesPlayed += 1;
        
        if (result.winner.toString() === team._id.toString()) {
          teamStats.wins += 1;
          teamStats.points += 3;
        } else if (result.isDraw) {
          teamStats.draws += 1;
          teamStats.points += 1;
        } else {
          teamStats.losses += 1;
        }
      });
    });
    
    // Sort by points, then by wins, then by goal difference if available
    return Array.from(standings.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return 0;
    });
  }
}

module.exports = new TournamentService();