import { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// Login with email and password
export const login = async (email: string, password: string): Promise<User> => {
  try {
    const response = await apiRequest('POST', '/api/auth/login', { email, password });
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

// Register a new user
export const register = async (email: string, password: string, phone?: string): Promise<User> => {
  try {
    const response = await apiRequest('POST', '/api/auth/register', { email, password, phone });
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
};

// Logout the current user
export const logout = async (): Promise<void> => {
  try {
    await apiRequest('POST', '/api/auth/logout', {});
  } catch (error) {
    console.error("Logout failed:", error);
    throw error;
  }
};

// Get the current logged in user
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 401) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.statusText}`);
    }
    
    const user = await response.json();
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await apiRequest('PUT', '/api/auth/profile', userData);
    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    console.error("Profile update failed:", error);
    throw error;
  }
};

// Change user password
export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  try {
    await apiRequest('PUT', '/api/auth/password', { oldPassword, newPassword });
  } catch (error) {
    console.error("Password change failed:", error);
    throw error;
  }
};
