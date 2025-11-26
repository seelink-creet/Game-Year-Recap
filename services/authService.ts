
import { User, PlatformType, Game } from '../types';

const USERS_STORAGE_KEY = 'gyr_users_db';
const GAMES_STORAGE_PREFIX = 'gyr_games_';

// Helper to get all users
const getUsersDB = (): Record<string, User> => {
  if (typeof window === 'undefined') return {};
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  return data ? JSON.parse(data) : {};
};

// Helper to save DB
const saveUsersDB = (db: Record<string, User>) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(db));
};

export interface CommunityGameStat {
  name: string;
  count: number;
  platforms: PlatformType[];
  latestPlayer: string;
}

export const authService = {
  register: (username: string, email: string, password: string): { success: boolean; message: string } => {
    const db = getUsersDB();
    
    if (db[username]) {
      return { success: false, message: 'Username already exists' };
    }

    // Check if email is used
    const emailExists = Object.values(db).some(u => u.email === email);
    if (emailExists) {
      return { success: false, message: 'Email already registered' };
    }

    // Create new user
    db[username] = {
      username,
      email,
      password, // In a real app, hash this!
      games: [],
      platforms: []
    };

    saveUsersDB(db);
    return { success: true, message: 'Registration successful' };
  },

  login: (username: string, password: string): { success: boolean; message: string } => {
    const db = getUsersDB();
    const user = db[username];

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.password !== password) {
      return { success: false, message: 'Invalid password' };
    }

    return { success: true, message: 'Login successful' };
  },

  resetPasswordRequest: (email: string): { success: boolean; message: string; recoveredPassword?: string } => {
    const db = getUsersDB();
    const user = Object.values(db).find(u => u.email === email);

    if (!user) {
      return { success: false, message: 'Email not found in our records' };
    }

    // In a real app, send an email. Here, we simulate by "alerting" or returning the password for demo purposes.
    // For the sake of this local tool, we will return success.
    return { success: true, message: 'If this email is registered, we have sent a recovery link.', recoveredPassword: user.password }; 
  },

  changePassword: (username: string, oldPassword: string, newPassword: string): { success: boolean; message: string } => {
    const db = getUsersDB();
    const user = db[username];

    if (!user) return { success: false, message: 'User error' };

    if (user.password !== oldPassword) {
      return { success: false, message: 'Current password is incorrect' };
    }

    user.password = newPassword;
    saveUsersDB(db);
    
    return { success: true, message: 'Password updated successfully' };
  },

  // New function to aggregate community stats
  getCommunityStats: (): CommunityGameStat[] => {
    if (typeof window === 'undefined') return [];
    
    const db = getUsersDB();
    const stats: Record<string, { count: number, platforms: Set<PlatformType>, latestPlayer: string }> = {};

    Object.keys(db).forEach(username => {
      // Retrieve games for this user from their specific storage key
      const userGamesJson = localStorage.getItem(`${GAMES_STORAGE_PREFIX}${username}`);
      if (userGamesJson) {
        try {
          const userGames: Game[] = JSON.parse(userGamesJson);
          userGames.forEach(game => {
            if (!stats[game.name]) {
              stats[game.name] = { count: 0, platforms: new Set(), latestPlayer: username };
            }
            stats[game.name].count += 1;
            stats[game.name].platforms.add(game.platform);
            // Just keep one player name as a sample
            if (Math.random() > 0.5) stats[game.name].latestPlayer = username;
          });
        } catch (e) {
          console.warn(`Failed to parse games for user ${username}`);
        }
      }
    });

    return Object.entries(stats)
      .map(([name, data]) => ({
        name,
        count: data.count,
        platforms: Array.from(data.platforms),
        latestPlayer: data.latestPlayer
      }))
      .sort((a, b) => b.count - a.count);
  }
};
