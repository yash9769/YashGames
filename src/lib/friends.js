// src/lib/friends.js
// Friends and invitations service for MindMatch games

import { supabase } from './supabaseClient.js';

/**
 * Send a friend request
 * @param {string} friendId - The user ID to send request to
 * @returns {Promise<Object>} Friend request record
 */
export const sendFriendRequest = async (friendId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  // Check if already friends or request exists
  const { data: existing, error: checkError } = await supabase
    .from('friends')
    .select('*')
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`)
    .single();
    
  if (checkError && checkError.code !== 'PGRST116') throw checkError; // PGRST116 means no rows returned
  
  if (existing) {
    if (existing.status === 'accepted') throw new Error('Already friends');
    if (existing.status === 'pending') throw new Error('Friend request already sent');
  }
  
  const { data, error } = await supabase
    .from('friends')
    .insert({
      user_id: user.id,
      friend_id: friendId,
      status: 'pending'
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Accept a friend request
 * @param {string} requestId - The friend request ID to accept
 * @returns {Promise<Object>} Updated friend record
 */
export const acceptFriendRequest = async (requestId) => {
  const { data, error } = await supabase
    .from('friends')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Decline a friend request
 * @param {string} requestId - The friend request ID to decline
 * @returns {Promise<void>}
 */
export const declineFriendRequest = async (requestId) => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', requestId);
    
  if (error) throw error;
};

/**
 * Remove a friend
 * @param {string} friendId - The friend user ID to remove
 * @returns {Promise<void>}
 */
export const removeFriend = async (friendId) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const { error } = await supabase
    .from('friends')
    .delete()
    .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
    
  if (error) throw error;
};

/**
 * Get current user's friends
 * @param {string} status - Filter by status ('pending', 'accepted', or null for all)
 * @returns {Promise<Array>} List of friends with profile data
 */
export const getFriends = async (status = null) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  let query = supabase
    .from('friends')
    .select(`
      *,
      profiles:friend_id (
        id,
        username,
        full_name,
        avatar_url,
        xp,
        level
      )
    `)
    .eq('user_id', user.id);
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

/**
 * Get incoming friend requests
 * @returns {Promise<Array>} List of incoming friend requests with profile data
 */
export const getFriendRequests = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const { data, error } = await supabase
    .from('friends')
    .select(`
      *,
      profiles:user_id (
        id,
        username,
        full_name,
        avatar_url,
        xp,
        level
      )
    `)
    .eq('friend_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};

/**
 * Search for users by username
 * @param {string} query - Search query
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>} List of matching users
 */
export const searchUsers = async (query, limit = 10) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, xp, level')
    .ilike('username', `%${query}%`)
    .neq('id', user.id) // Exclude current user
    .limit(limit);
    
  if (error) throw error;
  return data;
};

/**
 * Send a game invitation
 * @param {Object} invitationData - Invitation details
 * @returns {Promise<Object>} Invitation record
 */
export const sendGameInvitation = async (invitationData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const { data, error } = await supabase
    .from('game_invitations')
    .insert({
      inviter_id: user.id,
      ...invitationData
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Respond to a game invitation
 * @param {string} invitationId - The invitation ID
 * @param {string} response - 'accepted' or 'declined'
 * @returns {Promise<Object>} Updated invitation record
 */
export const respondToGameInvitation = async (invitationId, response) => {
  if (!['accepted', 'declined'].includes(response)) {
    throw new Error('Invalid response type');
  }
  
  const { data, error } = await supabase
    .from('game_invitations')
    .update({ 
      status: response,
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

/**
 * Get game invitations for current user
 * @param {string} status - Filter by status ('pending', 'accepted', 'declined', or null for all)
 * @returns {Promise<Array>} List of invitations with inviter profile data
 */
export const getGameInvitations = async (status = null) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  let query = supabase
    .from('game_invitations')
    .select(`
      *,
      profiles:inviter_id (
        id,
        username,
        full_name,
        avatar_url,
        xp,
        level
      )
    `)
    .eq('invitee_id', user.id);
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

/**
 * Set up realtime subscription for friend requests
 * @param {Function} onRequestReceived - Callback when new friend request arrives
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFriendRequests = (onRequestReceived) => {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const channel = supabase
    .channel('friend-requests')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'friends',
      filter: `friend_id=eq.${user.id}&status=eq.pending`
    }, (payload) => {
      onRequestReceived(payload.new);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};

/**
 * Set up realtime subscription for game invitations
 * @param {Function} onInvitationReceived - Callback when new game invitation arrives
 * @returns {Function} Unsubscribe function
 */
export const subscribeToGameInvitations = (onInvitationReceived) => {
  const { data: { user } } = supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  
  const channel = supabase
    .channel('game-invitations')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'game_invitations',
      filter: `invitee_id=eq.${user.id}&status=eq.pending`
    }, (payload) => {
      onInvitationReceived(payload.new);
    })
    .subscribe();
    
  return () => {
    supabase.removeChannel(channel);
  };
};

export default {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  getFriends,
  getFriendRequests,
  searchUsers,
  sendGameInvitation,
  respondToGameInvitation,
  getGameInvitations,
  subscribeToFriendRequests,
  subscribeToGameInvitations
};