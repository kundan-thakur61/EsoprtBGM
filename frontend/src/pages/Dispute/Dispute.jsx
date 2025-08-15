import { useState } from 'react';
import api from '../../services/api';

export default function Dispute({ tournamentId }) {
  const [description, setDescription] = useState('');
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    await api.post('/disputes', { tournament: tournamentId, description });
    setMsg('Dispute submitted!');
  };
  return (
    <form onSubmit={submit}>
      <textarea value={description} onChange={e => setDescription(e.target.value)} required />
      <button type="submit">Submit Dispute</button>
      {msg && <div>{msg}</div>}
    </form>
  );
}