// src/components/FriendsList.jsx
// Friends list component showing how to use the friends system

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import friendsService from '../lib/friends.js';
import authService from '../lib/auth.js';

export default function FriendsList() {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  // Load current user and friends data
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // Get current user profile
      const profile = await authService.getProfile();
      setCurrentUser(profile);
      
      // Get friends and friend requests
      const [friendsData, requestsData] = await Promise.all([
        friendsService.getFriends('accepted'),
        friendsService.getFriendRequests()
      ]);
      
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to load friends data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const results = await friendsService.searchUsers(searchQuery);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
      console.error('Search failed:', err);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      await friendsService.sendFriendRequest(userId);
      // Refresh friend requests and search results
      const requestsData = await friendsService.getFriendRequests();
      setFriendRequests(requestsData);
      
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
    } catch (err) {
      setError(err.message);
      console.error('Failed to send friend request:', err);
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      await friendsService.acceptFriendRequest(requestId);
      // Refresh data
      const [friendsData, requestsData] = await Promise.all([
        friendsService.getFriends('accepted'),
        friendsService.getFriendRequests()
      ]);
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to accept friend request:', err);
    }
  };

  const handleDeclineFriendRequest = async (requestId) => {
    try {
      await friendsService.declineFriendRequest(requestId);
      // Refresh friend requests
      const requestsData = await friendsService.getFriendRequests();
      setFriendRequests(requestsData);
    } catch (err) {
      setError(err.message);
      console.error('Failed to decline friend request:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="animate-spin rounded-full border-4 border-accent border-t-transparent w-12 h-12"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
          <p className="text-white/60">To see your friends and send invitations, please sign in first.</p>
          <button 
            onClick={() => navigate('/')}
            className="btn-primary w-full max-w-xs mt-6"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh pt-safe pb-safe">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 bg-black/20 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white">Friends</h1>
        <div className="flex items-center gap-3">
          <span className="text-white/60">{currentUser.username}</span>
          <img 
            src={currentUser.avatar_url || '/default-avatar.png'} 
            alt="Avatar" 
            className="w-10 h-10 rounded-full border-2 border-white/20"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="p-4 bg-accent-hot/20 rounded-xl border border-accent-hot/30 text-accent-hot">
            {error}
          </div>
        )}

        {/* Friend Requests Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Friend Requests <span className="text-xs bg-accent-hot/20 px-2 py-1 rounded text-accent-hot">{friendRequests.length}</span>
          </h2>
          
          {friendRequests.length === 0 ? (
            <p className="text-white/50 text-center py-8">No friend requests</p>
          ) : (
            <div className="space-y-3">
              {friendRequests.map(request => (
                <div key={request.id} className="glass-card p-4 flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-1">
                    <img 
                      src={request.profiles.user_id.avatar_url || '/default-avatar.png'} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                    />
                    <div>
                      <p className="font-semibold text-white">{request.profiles.user_id.full_name || request.profiles.user_id.username}</p>
                      <p className="text-white/50 text-sm">wants to be your friend</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAcceptFriendRequest(request.id)}
                      className="px-3 py-2 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleDeclineFriendRequest(request.id)}
                      className="px-3 py-2 bg-white/10 text-white/60 rounded hover:bg-white/20 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search for Friends Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Find Friends</h2>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              placeholder="Search for users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-accent transition-colors text-lg"
            />
            <button 
              type="submit"
              className="btn-primary px-6"
            >
              Search
            </button>
          </form>
          
          {searchResults.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Search Results</h3>
              <div className="space-y-3">
                {searchResults.map(user => (
                  <div key={user.id} className="glass-card p-4 flex justify-between items-start">
                    <div className="flex items-center gap-3 flex-1">
                      <img 
                        src={user.avatar_url || '/default-avatar.png'} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full border-2 border-white/20"
                      />
                      <div>
                        <p className="font-semibold text-white">{user.full_name || user.username}</p>
                        <p className="text-white/50 text-sm">Level {user.level} • {user.xp} XP</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleSendFriendRequest(user.id)}
                      className="btn-primary px-4 py-2"
                    >
                      Add Friend
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {searchResults.length === 0 && searchQuery.length > 0 && (
            <p className="text-white/50 text-center py-8">No users found</p>
          )}
        </div>

        {/* Friends List Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Friends <span className="text-xs bg-accent/20 px-2 py-1 rounded text-accent">{friends.length}</span>
          </h2>
          
          {friends.length === 0 ? (
            <p className="text-white/50 text-center py-8">You don't have any friends yet. Search for users above to add them!</p>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <div key={friend.id} className="glass-card p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <img 
                      src={friend.profiles.friend_id.avatar_url || '/default-avatar.png'} 
                      alt="Avatar" 
                      className="w-10 h-10 rounded-full border-2 border-white/20"
                    />
                    <div>
                      <p className="font-semibold text-white">{friend.profiles.friend_id.full_name || friend.profiles.friend_id.username}</p>
                      <p className="text-white/50 text-sm">Level {friend.profiles.friend_id.level} • {friend.profiles.friend_id.xp} XP</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate(`/game/${Math.random().toString(36).substring(2, 6).toUpperCase()}?role=host&invite=${friend.profiles.friend_id.id}`)}
                      className="px-3 py-2 bg-accent/20 text-accent rounded hover:bg-accent/30 transition-colors"
                    >
                      Play
                    </button>
                    <button 
                      onClick={() => /* handleRemoveFriend(friend.id) */ alert('Remove friend functionality would go here')}
                      className="px-3 py-2 bg-white/10 text-white/60 rounded hover:bg-white/20 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}