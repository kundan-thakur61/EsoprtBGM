// src/hooks/useAuth.js
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  selectUser,
  selectIsAuthenticated,
  selectAuthLoading,
  selectAuthError,
  initializeAuth,
  getCurrentUser,
} from '@/features/auth/authSlice';

export function useAuth() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  useEffect(() => {
    // initialize from localStorage/socket on mount
    dispatch(initializeAuth());
    // then fetch fresh profile if token exists
    if (localStorage.getItem('token')) {
      dispatch(getCurrentUser());
    }
  }, [dispatch]);

  return { user, isAuthenticated, isLoading, error };
}
