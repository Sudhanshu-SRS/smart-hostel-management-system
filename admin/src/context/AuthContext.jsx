// admin/src/context/AuthContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { HARDCODED_ADMINS } from "../config/adminConfig";

const AuthContext = createContext();

// 🔹 Dynamic backend URL (Vite-safe)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialState = {
  token: localStorage.getItem("shms_admin_token"),
  isAuthenticated: false,
  loading: true,
  user: null,
  error: null,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "USER_LOADING":
      return {
        ...state,
        loading: true,
        error: null,
      };

    case "USER_LOADED":
    case "LOGIN_SUCCESS":
      const token = action.payload.token || state.token;

      if (token) {
        localStorage.setItem("shms_admin_token", token);
      }
      if (action.payload.user) {
        localStorage.setItem(
          "shms_admin_user",
          JSON.stringify(action.payload.user)
        );
      }

      return {
        ...state,
        token,
        user: action.payload.user,
        isAuthenticated: true,
        loading: false,
        error: null,
      };

    case "AUTH_ERROR":
    case "LOGIN_FAIL":
    case "LOGOUT":
      localStorage.removeItem("shms_admin_token");
      localStorage.removeItem("shms_admin_user");
      return {
        ...state,
        token: null,
        isAuthenticated: false,
        loading: false,
        user: null,
        error: action.payload,
      };

    case "CLEAR_ERRORS":
      return {
        ...state,
        error: null,
      };

    case "UPDATE_USER":
      const updatedUser = { ...state.user, ...action.payload };
      localStorage.setItem("shms_admin_user", JSON.stringify(updatedUser));
      return {
        ...state,
        user: updatedUser,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // 🔹 Configure axios defaults dynamically
  useEffect(() => {
    axios.defaults.baseURL = BASE_URL;
    axios.defaults.timeout = 10000;

    if (state.token && state.token.startsWith("hardcoded_admin_")) {
      axios.defaults.headers.common["X-Admin-Mode"] = "hardcoded";
      delete axios.defaults.headers.common["Authorization"];
    } else if (state.token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${state.token}`;
      delete axios.defaults.headers.common["X-Admin-Mode"];
    } else {
      delete axios.defaults.headers.common["Authorization"];
      delete axios.defaults.headers.common["X-Admin-Mode"];
    }
  }, [state.token]);

  // Load user on app start
  const loadUser = async () => {
    const token = state.token;

    if (token && token.startsWith("hardcoded_admin_")) {
      const storedUser = localStorage.getItem("shms_admin_user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          dispatch({
            type: "USER_LOADED",
            payload: { user },
          });
          return;
        } catch (err) {
          console.error("Error parsing stored user:", err);
        }
      }
      dispatch({ type: "AUTH_ERROR" });
    } else if (token) {
      dispatch({ type: "USER_LOADING" });
      try {
        const res = await axios.get("/api/auth/me");

        if (!["admin", "warden"].includes(res.data.user.role)) {
          throw new Error("Insufficient privileges for admin panel");
        }

        dispatch({
          type: "USER_LOADED",
          payload: { user: res.data.user },
        });
      } catch (error) {
        dispatch({
          type: "AUTH_ERROR",
          payload: error.response?.data?.message || "Failed to load user",
        });
      }
    } else {
      dispatch({ type: "AUTH_ERROR" });
    }
  };

  // Login
  const login = async (email, password) => {
    dispatch({ type: "USER_LOADING" });

    try {
      const hardcodedAdmin = HARDCODED_ADMINS.find(
        (admin) => admin.email === email && admin.password === password
      );

      if (hardcodedAdmin) {
        const adminUser = {
          id: `hardcoded_${hardcodedAdmin.role}_${Date.now()}`,
          name: hardcodedAdmin.name,
          email: hardcodedAdmin.email,
          role: hardcodedAdmin.role,
          phoneNumber: "N/A",
          studentId: null,
          profilePicture: null,
          lastLogin: new Date(),
          isHardcoded: true,
        };

        const fakeToken = `hardcoded_admin_${Date.now()}`;

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { user: adminUser, token: fakeToken },
        });

        toast.success(`🚀 Welcome to SHMS Admin Panel, ${adminUser.name}!`);
        return { success: true };
      }

      const res = await axios.post("/api/auth/login", { email, password });

      if (!["admin", "warden"].includes(res.data.user.role)) {
        throw new Error("Access denied. Admin privileges required.");
      }

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: res.data,
      });

      toast.success(`Welcome to SHMS Admin Panel, ${res.data.user.name}! 🚀`);
      return { success: true };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Invalid admin credentials";

      dispatch({
        type: "LOGIN_FAIL",
        payload: message,
      });

      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    dispatch({ type: "LOGOUT" });
    toast.info("Admin session ended. See you soon! 👋");
  };

  const updateUser = (userData) => {
    dispatch({ type: "UPDATE_USER", payload: userData });
  };

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
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
