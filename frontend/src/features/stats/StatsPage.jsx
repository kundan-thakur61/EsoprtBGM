/* src/pages/StatsPage.jsx */
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchOverallStats, fetchUserStats } from '@/features/stats/statsSlice';
import { selectUser } from '@/features/auth/authSlice';

const StatsPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { overall, userStats, isLoading, error } = useSelector((state) => state.stats);

  useEffect(() => {
    dispatch(fetchOverallStats());
    if (user?._id) {
      dispatch(fetchUserStats(user._id));
    }
  }, [dispatch, user?._id]);

  if (isLoading) {
    return <div className="p-6">Loading statistics...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Statistics</h1>

      {/* Overall Platform Stats */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Tournaments"
            value={overall?.totalTournaments || 0}
            icon="🏆"
          />
          <StatCard
            title="Active Players"
            value={overall?.activePlayers || 0}
            icon="👥"
          />
          <StatCard
            title="Matches Played"
            value={overall?.totalMatches || 0}
            icon="⚔️"
          />
          <StatCard
            title="Prize Pool"
            value={`$${overall?.totalPrizePool?.toLocaleString() || 0}`}
            icon="💰"
          />
        </div>
      </section>

      {/* User Personal Stats */}
      {user && userStats && (
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Performance</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Tournaments Joined"
              value={userStats.tournamentsJoined || 0}
              icon="🎯"
            />
            <StatCard
              title="Matches Won"
              value={userStats.matchesWon || 0}
              icon="🏅"
            />
            <StatCard
              title="Win Rate"
              value={`${userStats.winRate || 0}%`}
              icon="📊"
            />
            <StatCard
              title="Total Earnings"
              value={`$${userStats.totalEarnings?.toLocaleString() || 0}`}
              icon="💵"
            />
            <StatCard
              title="Current Rank"
              value={userStats.currentRank || 'Unranked'}
              icon="🏆"
            />
            <StatCard
              title="Games Played"
              value={userStats.totalGames || 0}
              icon="🎮"
            />
          </div>
        </section>
      )}

      {/* Recent Activity */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {userStats?.recentMatches?.length ? (
          <div className="space-y-3">
            {userStats.recentMatches.slice(0, 5).map((match) => (
              <div
                key={match._id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-medium">{match.tournamentName}</p>
                  <p className="text-sm text-gray-600">
                    vs {match.opponent} • {new Date(match.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-sm font-medium ${
                    match.result === 'won'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {match.result === 'won' ? 'Won' : 'Lost'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No recent matches to display</p>
        )}
      </section>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-gray-50 rounded-lg p-4 text-center">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-2xl font-bold text-gray-900">{value}</div>
    <div className="text-sm text-gray-600">{title}</div>
  </div>
);

export default StatsPage;
