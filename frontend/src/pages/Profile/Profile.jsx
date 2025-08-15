import { useEffect, useState } from 'react';
import api from '../../services/api';

export default function Profile() {
  const [user, setUser] = useState({});
  useEffect(() => {
    api.get('/auth/me').then(res => setUser(res.data));
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Profile</h2>
      <div>Username: {user.username}</div>
      <div>Email: {user.email}</div>
      <div>Referral Code: {user.referralCode}</div>
    </div>
  );
}