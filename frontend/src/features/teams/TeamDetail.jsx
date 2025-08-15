/* src/features/teams/TeamDetail.jsx */
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTeamById, selectTeam, selectTeamsLoading, selectTeamsError } from './teamsSlice';

const TeamDetail = () => {
  const { teamId } = useParams();
  const dispatch = useDispatch();
  const team = useSelector(selectTeam);
  const isLoading = useSelector(selectTeamsLoading);
  const error = useSelector(selectTeamsError);

  useEffect(() => {
    dispatch(fetchTeamById(teamId));
  }, [dispatch, teamId]);

  if (isLoading) {
    return <div className="p-6">Loading team details…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!team) {
    return <div className="p-6">Team not found.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{team.name}</h1>
        <Link
          to="/teams"
          className="text-sm text-primary-600 hover:underline"
        >
          ← Back to Teams
        </Link>
      </header>

      <section className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Roster</h2>
          {team.members.length ? (
            <ul className="list-disc list-inside mt-2">
              {team.members.map((m) => (
                <li key={m._id}>
                  {m.username} ({m.role})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 mt-2">No members in this team.</p>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold">Statistics</h2>
          <dl className="grid grid-cols-2 gap-4 mt-2">
            <div>
              <dt className="text-sm text-gray-600">Matches Played</dt>
              <dd className="font-medium">{team.stats.matchesPlayed}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Matches Won</dt>
              <dd className="font-medium">{team.stats.matchesWon}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Win Rate</dt>
              <dd className="font-medium">
                {((team.stats.matchesWon / Math.max(team.stats.matchesPlayed, 1)) * 100).toFixed(1)}%
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-600">Tournaments Joined</dt>
              <dd className="font-medium">{team.stats.tournamentsJoined}</dd>
            </div>
          </dl>
        </div>

        {team.description && (
          <div>
            <h2 className="text-xl font-semibold">About</h2>
            <p className="mt-2 text-gray-700">{team.description}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default TeamDetail;
