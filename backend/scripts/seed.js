require('dotenv').config();
const connectDB = require('../config/db');
const Team = require('../models/Team');

connectDB();

const seedTeams = async () => {
  try {
    await Team.deleteMany({});

    const teams = [
      { teamName: "Rebel Gamers", players: ["Alpha", "Bravo", "Charlie", "Delta"] },
      { teamName: "Pixel Ninjas", players: ['Echo', 'Foxtrot', 'Golf', 'Hotel'] }
    ];

    await Team.insertMany(teams);
    console.log('Seeded teams');
    procrequire('dotenv').config();
const connectDB = require('../config/db');
const Team = require('../models/Team');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

const seedData = async () => {
  try {
    await connectDB();

    await Team.deleteMany({});
    await User.deleteMany({});
    await Tournament.deleteMany({});

    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@esports.com',
      password: 'admin123',
      role: 'admin',
    });

    const teams = [
      { teamName: 'Rebel Gamers', players: ['Alpha', 'Bravo', 'Charlie', 'Delta'], captain: adminUser._id },
      { teamName: 'Pixel Ninjas', players: ['Echo', 'Foxtrot', 'Golf', 'Hotel'], captain: adminUser._id },
    ];

    await Team.insertMany(teams);

    await Tournament.create({
      name: 'PUBG Mobile India Series Qualifier',
      dateRange: '2025-08-01 to 2025-08-09',
      region: 'India',
      prizePool: '₹30,00,000',
      format: 'Double Elimination'
    });

    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
ess.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedTeams();
