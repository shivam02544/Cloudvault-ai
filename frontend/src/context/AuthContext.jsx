import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // idToken is what we send to the API Gateway Cognito Authorizer
  const [idToken, setIdToken] = useState(() => localStorage.getItem(ID_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

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
  };

  useEffect(() => {
    // Restore session from Cognito SDK (uses its own localStorage keys)
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.getSession((err, session) => {
        if (!err && session.isValid()) {
          setUser(currentUser);
          persistTokens(session);
        } else {
          clearTokens();
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Compute isAdmin from JWT claims (stabilized with useMemo)
  const isAdmin = React.useMemo(() => {
    if (!idToken) return false;
    try {
      const base64Url = idToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const claims = JSON.parse(jsonPayload);
      
      // DEBUG: confirm claims content in development
      console.log('[AuthContext] JWT Claims:', claims);
      
      const groups = claims['cognito:groups'] || [];
      const result = Array.isArray(groups) ? groups.includes('admin') : groups === 'admin';
      
      console.log('[AuthContext] isAdmin check:', { groups, result });
      return result;
    } catch (e) {
      console.error('[AuthContext] JWT decode error:', e);
      return false;
    }
  }, [idToken]);

  const login = (email, password) =>
    new Promise((resolve, reject) => {
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });
      const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          setUser(cognitoUser);
          persistTokens(session);
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
    // Expose idToken as `token` and the calculated isAdmin flag
    <AuthContext.Provider value={{ user, token: idToken, isAdmin, loading, login, signup, confirmSignup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
