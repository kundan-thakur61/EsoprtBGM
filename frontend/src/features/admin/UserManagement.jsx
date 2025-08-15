/* src/features/admin/UserManagement.jsx */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
  selectUsers,
  selectUsersLoading,
  selectUsersError,
} from '../admin/adminSlice';

const UserManagement = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectUsers);
  const isLoading = useSelector(selectUsersLoading);
  const error = useSelector(selectUsersError);

  const [form, setForm] = useState({ username: '', email: '', role: 'user' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      dispatch(updateUser({ id: editingId, data: form }));
    } else {
      dispatch(createUser(form));
    }
    setForm({ username: '', email: '', role: 'user' });
    setEditingId(null);
  };

  const startEdit = (u) => {
    setForm({ username: u.username, email: u.email, role: u.role });
    setEditingId(u._id);
  };

  if (isLoading) return <p className="p-6">Loading users…</p>;
  if (error) return <p className="p-6 text-red-600">Error: {error}</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow space-y-4">
        <h2 className="text-xl">{editingId ? 'Edit User' : 'New User'}</h2>
        <div>
          <label className="block text-sm">Username</label>
          <input name="username" value={form.username} onChange={handleChange}
            className="mt-1 block w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange}
            className="mt-1 block w-full border rounded p-2" required />
        </div>
        <div>
          <label className="block text-sm">Role</label>
          <select name="role" value={form.role} onChange={handleChange}
            className="mt-1 block w-full border rounded p-2">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="bg-primary-600 text-white px-4 py-2 rounded">
          {editingId ? 'Update' : 'Create'}
        </button>
      </form>

      <ul className="space-y-4">
        {users.map((u) => (
          <li key={u._id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <h3 className="font-medium">{u.username}</h3>
              <p className="text-sm text-gray-500">{u.email} — {u.role}</p>
            </div>
            <div className="space-x-2">
              <button onClick={() => startEdit(u)}
                className="text-blue-600 hover:underline">Edit</button>
              <button onClick={() => dispatch(deleteUser(u._id))}
                className="text-red-600 hover:underline">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserManagement;
