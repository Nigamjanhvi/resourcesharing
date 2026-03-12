import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, isLoading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        error: null,
      };
    case 'AUTH_FAILURE':
      return { ...state, isLoading: false, error: action.payload, isAuthenticated: false };
    case 'LOGOUT':
      return { ...initialState, token: null, refreshToken: null, isLoading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const { data } = await api.get('/auth/me');
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: data.data.user,
            token,
            refreshToken: localStorage.getItem('refreshToken'),
          },
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        dispatch({ type: 'LOGOUT' });
      }
    };

    verifyToken();
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      const { user, token, refreshToken } = data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token, refreshToken } });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const { data } = await api.post('/auth/register', userData);
      const { user, token, refreshToken } = data.data;

      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);

      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token, refreshToken } });
      return { success: true };
    } catch (error) {
      let message = error.response?.data?.message;
      if (!message && error.response?.data?.errors) {
        message = error.response.data.errors.map(err => err.msg).join(', ');
      }
      if (!message) message = 'Registration failed.';

      dispatch({ type: 'AUTH_FAILURE', payload: message });
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((updates) => {
    dispatch({ type: 'UPDATE_USER', payload: updates });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
