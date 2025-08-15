/* src/features/teams/TeamList.jsx */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTeams,
  selectTeams,
  selectTeamsLoading,
  selectTeamsError,
} from './teamsSlice';

const TeamList = () => {
  const dispatch = useDispatch();
  const teams = useSelector(selectTeams);
  const isLoading = useSelector(selectTeamsLoading);
  const error = useSelector(selectTeamsError);

  useEffect(() => {
    dispatch(fetchTeams());
  }, [dispatch]);

  if (isLoading) {
    return <div className="p-6">Loading teams…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-6">
      <header className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Teams</h1>
        <Link
          to="/teams/new"
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          + New Team
        </Link>
      </header>

      {teams.length ? (
        <ul className="space-y-4">
          {teams.map((team) => (
            <li
              key={team._id}
              className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
            >
              <Link
                to={`/teams/${team._id}`}
                className="text-lg font-medium text-primary-700 hover:underline"
              >
                {team.name}
              </Link>
              <span className="text-sm text-gray-500">
                {team.members.length} members
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">No teams found.</p>
      )}
    </div>
  );
};

export default TeamList;
