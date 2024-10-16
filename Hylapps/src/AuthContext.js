import React, { createContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types'; 
import { useNavigate } from 'react-router-dom';
import {jwtDecode} from 'jwt-decode'; // Correct import

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    
    if (token) {
      setIsAuthenticated(true); // Update the state to true if token exists
      try {
        const decodedToken = jwtDecode(token);
        setRole(decodedToken.role); // Set role from token
      } catch (error) {
        console.error("Error decoding token:", error);
        localStorage.removeItem("token"); // Clear invalid token
        setIsAuthenticated(false); // Update state
        setRole(null); // Reset role
      }
    } else {
      setIsAuthenticated(false); // Set to false if no token
    }
  }, []);
  

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, role, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};


