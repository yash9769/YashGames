// src/lib/auth.js
// Authentication helper functions for Supabase

import { supabase } from './supabaseClient.js';

/**
 * Sign up a new user
 * @param {Object} credentials - Email and password
 * @returns {Promise<Object>} Supabase auth response
 */
export const signUp = async (credentials) => {
  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      data: {
        username: credentials.username || credentials.email.split('@')[0],
        full_name: credentials.full_name || ''
      }
    }
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign in an existing user
 * @param {Object} credentials - Email and password
 * @returns {Promise<Object>} Supabase auth response
 */
export const signIn = async (credentials) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });
  
  if (error) throw error;
  return data;
};

/**
 * Sign out the current user
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

/**
 * Get the current user session
 * @returns {Promise<Object>} Current session data
 */
export const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data;
};

/**
 * Get the current user profile
 * @returns {Promise<Object>} User profile data
 */
export const getProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Update user profile
 * @param {Object} updates - Profile fields to update
 * @returns {Promise<Object>} Updated profile data
 */
export const updateProfile = async (updates) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @returns {Promise<void>}
 */
export const resetPassword = async (email) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  
  if (error) throw error;
};

/**
 * Update user password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export const updatePassword = async (newPassword) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  
  if (error) throw error;
};

export default {
  signUp,
  signIn,
  signOut,
  getSession,
  getProfile,
  updateProfile,
  resetPassword,
  updatePassword
};