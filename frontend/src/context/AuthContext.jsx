import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// Base URL from environment
const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem("shms_token"),
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "USER_LOADING":
      return { ...state, loading: true, error: null };
    case "USER_LOADED":
      return {
        ...state,
        isAuthenticated: true,
        loading: false,
        user: action.payload,
        error: null,
      };
    case "LOGIN_SUCCESS":
    case "REGISTER_SUCCESS":
      localStorage.setItem("shms_token", action.payload.token);
      return {
        ...state,
        ...action.payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case "AUTH_ERROR":
    case "LOGIN_FAIL":
    case "REGISTER_FAIL":
    case "LOGOUT":
      localStorage.removeItem("shms_token");
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload,
      };
    case "CLEAR_ERRORS":
      return { ...state, error: null };
    case "UPDATE_USER":
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set axios base URL and Authorization header
  useEffect(() => {
    axios.defaults.baseURL = API_URL;
    if (state.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [state.token]);

  // Load user on app start
  const loadUser = async () => {
    if (!state.token) {
      dispatch({ type: "AUTH_ERROR", payload: null });
      return;
    }

    dispatch({ type: "USER_LOADING" });
    try {
      const res = await axios.get("/api/auth/me");
      const userData = {
        ...res.data.user,
        id: res.data.user._id || res.data.user.id,
        _id: res.data.user._id || res.data.user.id,
      };
      dispatch({ type: "USER_LOADED", payload: userData });
    } catch (error) {
      dispatch({
        type: "AUTH_ERROR",
        payload: error.response?.data?.message || "Failed to load user",
      });
    }
  };

  // Register user
  const register = async (formData) => {
    dispatch({ type: "USER_LOADING" });
    try {
      const res = await axios.post("/api/auth/register", formData);
      dispatch({ type: "REGISTER_SUCCESS", payload: res.data });
      toast.success(
        `🎉 Welcome to SHMS, ${res.data.user.name}! Check your email for account details.`,
        { duration: 5000 }
      );
      return { success: true, studentId: res.data.user.studentId };
    } catch (error) {
      const message = error.response?.data?.message || "Registration failed";
      dispatch({ type: "REGISTER_FAIL", payload: message });
      toast.error(message);
      return { success: false, message };
    }
  };

  // Login user
  const login = async (email, password) => {
    dispatch({ type: "USER_LOADING" });
    try {
      const res = await axios.post("/api/auth/login", { email, password });
      const userData = {
        ...res.data.user,
        id: res.data.user._id || res.data.user.id,
        _id: res.data.user._id || res.data.user.id,
      };
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { ...res.data, user: userData },
      });
      toast.success(`Welcome back, ${userData.name}! 👋`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      dispatch({ type: "LOGIN_FAIL", payload: message });
      toast.error(message);
      return { success: false, message };
    }
  };

  // Logout
  const logout = () => {
    dispatch({ type: "LOGOUT" });
    toast.info("Logged out successfully. See you soon! 👋");
  };

  // Update user
  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

  // Clear errors
  const clearErrors = () => {
    dispatch({ type: "CLEAR_ERRORS" });
  };

  useEffect(() => {
    loadUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        register,
        login,
        logout,
        loadUser,
        updateUser,
        clearErrors,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
