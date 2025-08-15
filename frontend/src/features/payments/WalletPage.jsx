/* src/pages/WalletPage.jsx */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, getCurrentUser } from '@/features/auth/authSlice';
import axiosClient from '@/api/axiosClient';

const WalletPage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Refresh user & fetch transactions on mount
  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
    fetchTransactions();
  }, [dispatch, user]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosClient.get(`/wallet/transactions`);
      setTransactions(data.transactions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-6">Loading wallet…</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-3xl font-bold">${user.wallet?.balance?.toFixed(2) ?? '0.00'}</p>
        </div>
        <button
          onClick={fetchTransactions}
          className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Transaction History</h2>
        {loading ? (
          <p>Loading transactions…</p>
        ) : error ? (
          <p className="text-red-600">Error: {error}</p>
        ) : transactions.length ? (
          <ul className="divide-y">
            {transactions.map((tx) => (
              <li key={tx._id} className="py-2 flex justify-between">
                <div>
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.date).toLocaleString()}
                  </p>
                </div>
                <p
                  className={`font-medium ${
                    tx.amount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {tx.amount >= 0 ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No transactions found.</p>
        )}
      </section>
    </div>
  );
};

export default WalletPage;
