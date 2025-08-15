import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Wallet() {
  const [wallet, setWallet] = useState(0);
  useEffect(() => {
    api.get('/auth/me').then(res => setWallet(res.data.wallet));
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Wallet</h2>
      <div>Balance: ₹{wallet}</div>
    </div>
  );
}