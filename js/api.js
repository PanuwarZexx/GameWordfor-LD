// API Client for Thai Word Game
const API_BASE_URL = 'https://gamewordfor-ld.onrender.com/api';
// const API_BASE_URL = 'http://localhost:3000/api';
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

    // ==================== ADMIN ====================

    async getAdminUsers() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Admin get users error:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(userData)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Admin create user error:', error);
            throw error;
        }
    }

    async updateUserRole(userId, role) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ role })
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Admin update role error:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Admin delete user error:', error);
            throw error;
        }
    }

    // ==================== TEACHER ====================

    async getStudentsList() {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/students`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Teacher get students error:', error);
            throw error;
        }
    }

    async getStudentDetail(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/students/${studentId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Teacher get student detail error:', error);
            throw error;
        }
    }

    async getStudentHistory(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/students/${studentId}/history`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Teacher get history error:', error);
            throw error;
        }
    }

    // ==================== PLAY LOGGING ====================

    async logPlayAttempt(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/progress/log`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });
            return await this.handleResponse(response);
        } catch (error) {
            console.error('Log play attempt error:', error);
            // Don't throw - logging should not block gameplay
        }
    }
}

// Create global API instance
const gameAPI = new GameAPI();
