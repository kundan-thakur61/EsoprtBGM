/* src/features/admin/TournamentManagement.jsx */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTournaments,
  createTournament,
  updateTournament,
  deleteTournament,
  selectTournaments,
  selectTournamentsLoading,
  selectTournamentsError,
} from '../tournaments/tournamentsSlice';

const TournamentManagement = () => {
  const dispatch = useDispatch();
  const tournaments = useSelector(selectTournaments);
  const isLoading = useSelector(selectTournamentsLoading);
  const error = useSelector(selectTournamentsError);

  const [form, setForm] = useState({ name: '', startDate: '', status: 'upcoming' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchTournaments());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updateTournament({ id: editingId, data: form }));
    } else {
      dispatch(createTournament(form));
    }
    setForm({ name: '', startDate: '', status: 'upcoming' });
    setEditingId(null);
  };

  const startEdit = (t) => {
    setForm({ name: t.name, startDate: t.startDate.slice(0, 10), status: t.status });
    setEditingId(t._id);
  };

  if (isLoading) return <p className="p-6">Loading tournaments…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Tournament Management</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-xl">{editingId ? 'Edit Tournament' : 'New Tournament'}</h2>
        <div>
          <label className="block text-sm">Name</label>
          <input name="name" value={form.name} onChange={handleChange}
            className="mt-1 block w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm">Start Date</label>
          <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
            className="mt-1 block w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm">Status</label>
          <select name="status" value={form.status} onChange={handleChange}
            className="mt-1 block w-full border rounded p-2">
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Create'}
        </button>
      </form>

      <ul className="space-y-4">
        {tournaments.map((t) => (
          <li key={t._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-medium">{t.name}</h3>
              <p className="text-sm text-gray-500">
                {new Date(t.startDate).toLocaleDateString()} — {t.status}
              </p>
            </div>
            <div className="space-x-2">
              <button onClick={() => startEdit(t)}
                className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => dispatch(deleteTournament(t._id))}
                className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TournamentManagement;
