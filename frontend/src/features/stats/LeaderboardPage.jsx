/* src/features/stats/LeaderboardPage.jsx */
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLeaderboard } from './statsSlice';

const LeaderboardPage = () => {
  const dispatch = useDispatch();
  const { leaderboard, isLoading, error } = useSelector((state) => state.stats);

  useEffect(() => {
    dispatch(fetchLeaderboard());
  }, [dispatch]);

  if (isLoading) return <p>Loading leaderboard…</p>;
  if (error) return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Leaderboard</h1>
      <ol className="list-decimal list-inside space-y-2">
        {leaderboard.map((entry, idx) => (
          <li key={entry._id} className="flex justify-between">
            <span>
              {idx + 1}. {entry.username}
            </span>
            <span className="font-medium">{entry.score}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default LeaderboardPage;
