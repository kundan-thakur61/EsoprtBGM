/* src/pages/ProfilePage.jsx */
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser, getCurrentUser } from '@/features/auth/authSlice';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, user]);

  if (!user) {
    return <div className="p-6">Loading profile...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <p className="text-gray-900">{user.username}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <p className="text-gray-900">{user.firstName || 'Not set'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <p className="text-gray-900">{user.lastName || 'Not set'}</p>
          </div>
        </div>
        
        <div className="mt-6">
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
