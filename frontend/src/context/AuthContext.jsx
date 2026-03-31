import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import axios from 'axios';

const poolData = {
  UserPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
  ClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
};

if (!poolData.UserPoolId || !poolData.ClientId) {
  console.warn('Cognito env vars missing (VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID)');
}

const userPool = new CognitoUserPool(poolData);

const AuthContext = createContext(null);

// Token storage keys
const ID_TOKEN_KEY = 'cv_id_token';
const ACCESS_TOKEN_KEY = 'cv_access_token';

// JWT helper to check admin status without using state
const parseIsAdmin = (token) => {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
    const claims = JSON.parse(jsonPayload);
    const groups = claims['cognito:groups'] || [];
    if (typeof groups === 'string') {
      try { return JSON.parse(groups).includes('admin'); } catch { return groups === 'admin'; }
    }
    return Array.isArray(groups) ? groups.includes('admin') : false;
  } catch {
    return false;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // idToken is what we send to the API Gateway Cognito Authorizer
  const [idToken, setIdToken] = useState(() => localStorage.getItem(ID_TOKEN_KEY));
  const [status, setStatus] = useState('loading'); // loading, active, pending, denied
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;

  const persistTokens = (session) => {
    const id = session.getIdToken().getJwtToken();
    const access = session.getAccessToken().getJwtToken();
    localStorage.setItem(ID_TOKEN_KEY, id);
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    setIdToken(id);
  };

  const clearTokens = () => {
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setIdToken(null);
    setStatus('loading');
  };

  const checkStatus = async (token) => {
    if (!token) return 'loading';
    try {
      const res = await axios.get(`${API_URL}/auth/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.status || 'pending';
    } catch (e) {
      console.error('Status check failed:', e);
      return 'active'; // Fail-open for safety (or 'pending' for security)
    }
  };

  useEffect(() => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession(async (err, session) => {
        if (!err && session.isValid()) {
          const token = session.getIdToken().getJwtToken();
          setUser(currentUser);
          persistTokens(session);
          
          // Verify Account Status (Admins are always active)
          const s = parseIsAdmin(token) ? 'active' : await checkStatus(token);
          setStatus(s);
        } else {
          clearTokens();
          setStatus('loading');
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
      setStatus('loading');
    }
  }, []);

  const isAdmin = React.useMemo(() => parseIsAdmin(idToken), [idToken]);

  const login = (email, password) =>
    new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: async (session) => {
          const token = session.getIdToken().getJwtToken();
          setUser(cognitoUser);
          persistTokens(session);
          
          // Verify Status immediately on login
          const s = parseIsAdmin(token) ? 'active' : await checkStatus(token);
          setStatus(s);
          
          resolve(session);
        },
        onFailure: reject,
      });
    });

  const signup = (email, password) =>
    new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];
      userPool.signUp(email, password, attributes, null, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

  const confirmSignup = (email, code) =>
    new Promise((resolve, reject) => {
      const userData = {
        Username: email,
        Pool: userPool,
      };
      const cognitoUser = new CognitoUser(userData);
      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });

  const logout = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) currentUser.signOut();
    setUser(null);
    clearTokens();
  };

  return (
    // Expose idToken as `token`, calculated isAdmin flag, and account status
    <AuthContext.Provider value={{ 
      user, 
      token: idToken, 
      isAdmin, 
      status,
      loading: loading || (idToken && status === 'loading'),
      login, 
      signup, 
      confirmSignup, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
