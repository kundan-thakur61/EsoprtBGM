import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Referral() {
  const [code, setCode] = useState('');
  useEffect(() => {
    api.get('/auth/me').then(res => setCode(res.data.referralCode));
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Referral</h2>
      <div>Your Referral Code: <b>{code}</b></div>
      <div>Share this code with friends to earn rewards!</div>
    </div>
  );
}