import { useState } from 'react';
import api from '../../services/api';

export default function DailyReward() {
  const [msg, setMsg] = useState('');
  const claim = async () => {
    try {
      const res = await api.post('/users/daily-reward');
      setMsg(res.data.message);
    } catch (e) {
      setMsg(e.response.data.message);
    }
  };
  return (
    <div>
      <button onClick={claim}>Claim Daily Reward</button>
      {msg && <div>{msg}</div>}
    </div>
  );
}