// API Client for Thai Word Game
const API_BASE_URL = 'https://games-word-thai.onrender.com/api';

class GameAPI {
    constructor() {
        this.token = localStorage.getItem('authToken');
    }

    // Set token after login/register
    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    // Clear token on logout
    clearToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    // Get headers with authentication
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    // Handle API response
    async handleResponse(response) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'เกิดข้อผิดพลาด');
        }
        return data;
    }

    // ==================== AUTH ====================

    async register(username, password, displayName, characterId) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password, displayName, characterId })
            });
            const data = await this.handleResponse(response);
            this.setToken(data.token);
            return data;
        } catch (error) {
            console.error('Register error:', error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ username, password })
            });
            const data = await this.handleResponse(response);
            this.setToken(data.token);
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // ==================== USER ====================

    async getUserProfile() {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    async updateUserProfile(displayName, characterId) {
        try {
            const response = await fetch(`${API_BASE_URL}/user/profile`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ displayName, characterId })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    // ==================== PROGRESS ====================

    async getProgress() {
        try {
            const response = await fetch(`${API_BASE_URL}/progress`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get progress error:', error);
            throw error;
        }
    }

    async updateProgress(progressData) {
        try {
            const response = await fetch(`${API_BASE_URL}/progress`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(progressData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update progress error:', error);
            throw error;
        }
    }

    // ==================== LEADERBOARD ====================

    async getLeaderboard(period = 'allTime', limit = 100) {
        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard/${period}?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get leaderboard error:', error);
            throw error;
        }
    }

    async updateLeaderboard(score, level, period = 'allTime') {
        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ score, level, period })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Update leaderboard error:', error);
            throw error;
        }
    }

    // ==================== USERS SUMMARY ====================

    async getUsersSummary(limit = 30) {
        try {
            const response = await fetch(`${API_BASE_URL}/users/summary?limit=${limit}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Get users summary error:', error);
            throw error;
        }
    }
}

// Create global API instance
const gameAPI = new GameAPI();
