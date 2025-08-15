import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Leaderboard({ tournamentId }) {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.get(`/tournaments/${tournamentId}/leaderboard`).then(res => setData(res.data));
  }, [tournamentId]);
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Leaderboard</h2>
      <table className="min-w-full">
        <thead><tr><th>Rank</th><th>Player</th><th>Score</th></tr></thead>
        <tbody>
          {data.map(row => (
            <tr key={row.rank}>
              <td>{row.rank}</td>
              <td>{row.username}</td>
              <td>{row.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}