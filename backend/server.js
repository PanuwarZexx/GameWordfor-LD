const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Match case-sensitive Linux filenames on Render
const User = require('./models/user');
const Progress = require('./models/progress');
const Leaderboard = require('./models/leaderboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: [
        'http://localhost:5500', 
        'http://127.0.0.1:5500', 
        'http://localhost:5501', 
        'http://127.0.0.1:5501',
        'https://games-word-thai.netlify.app',
        'https://project-com-tech.ubru.ac.th',
        'http://project-com-tech.ubru.ac.th'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Thai Word Game API',
        status: 'running',
        endpoints: {
            auth: '/api/auth/register, /api/auth/login',
            user: '/api/user/profile',
            progress: '/api/progress',
            leaderboard: '/api/leaderboard/:period'
        }
    });
});

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, displayName, characterId } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = new User({
            username,
            password: hashedPassword,
            displayName,
            characterId,
            characterImage: `${characterId}.png`
        });

        await user.save();

        // Create initial progress
        const progress = new Progress({
            userId: user._id,
            unlockedLevels: [1],
            levelScores: {},
            answeredWords: {}
        });

        await progress.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                characterId: user.characterId,
                characterImage: user.characterImage
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Check password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        // Update last login
        user.lastLoginAt = new Date();
        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                characterId: user.characterId,
                characterImage: user.characterImage,
                totalScore: user.totalScore
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// ==================== USER ROUTES ====================

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.put('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const { displayName, characterId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.userId,
            {
                displayName,
                characterId,
                characterImage: `${characterId}.png`
            },
            { new: true }
        ).select('-password');

        res.json({
            message: 'Profile updated successfully',
            user
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PROGRESS ROUTES ====================

// Get user progress
app.get('/api/progress', authenticateToken, async (req, res) => {
    try {
        const progress = await Progress.findOne({ userId: req.user.userId });
        if (!progress) {
            return res.status(404).json({ error: 'Progress not found' });
        }
        res.json(progress);
    } catch (error) {
        console.error('Progress fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update progress
app.put('/api/progress', authenticateToken, async (req, res) => {
    try {
        const {
            unlockedLevels,
            levelScores,
            answeredWords,
            completedLevels,
            currentLevel,
            totalStars
        } = req.body;

        const progress = await Progress.findOneAndUpdate(
            { userId: req.user.userId },
            {
                unlockedLevels,
                levelScores,
                answeredWords,
                completedLevels,
                currentLevel,
                totalStars,
                updatedAt: new Date()
            },
            { new: true, upsert: true }
        );

        // Update user's total score
        const totalScore = Object.values(levelScores || {}).reduce((sum, score) => sum + score, 0);
        await User.findByIdAndUpdate(req.user.userId, { totalScore });

        res.json({
            message: 'Progress updated successfully',
            progress
        });
    } catch (error) {
        console.error('Progress update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== USERS SUMMARY ROUTE ====================

// Get last 30 users with their progress (for results summary page)
app.get('/api/users/summary', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 30;
        
        // Get last 30 users sorted by most recent login
        const users = await User.find()
            .select('-password')
            .sort({ lastLoginAt: -1 })
            .limit(limit);
        
        // Get progress for each user
        const userIds = users.map(u => u._id);
        const progressList = await Progress.find({ userId: { $in: userIds } }).lean();
        
        // Create a map of userId -> progress
        const progressMap = {};
        progressList.forEach(p => {
            progressMap[p.userId.toString()] = p;
        });
        
        // Combine user + progress data
        const summary = users.map(user => {
            const progress = progressMap[user._id.toString()] || {};
            
            // answeredWords จาก .lean() จะเป็น plain object
            const answeredWords = progress.answeredWords || {};
            
            // Calculate total answered
            let totalAnswered = 0;
            const levelDetails = {};
            for (let level = 1; level <= 10; level++) {
                const key = String(level);
                let answered = 0;
                
                // รองรับทั้ง Map object และ plain object
                const wordsList = answeredWords[key] || answeredWords.get?.(key);
                if (wordsList && Array.isArray(wordsList)) {
                    answered = wordsList.length;
                }
                
                totalAnswered += answered;
                levelDetails[key] = answered;
            }
            
            const unlockedLevels = progress.unlockedLevels || [1];
            const maxUnlocked = Array.isArray(unlockedLevels) && unlockedLevels.length > 0 
                ? Math.max(...unlockedLevels) 
                : 1;
            
            return {
                username: user.username,
                displayName: user.displayName,
                characterId: user.characterId,
                totalScore: user.totalScore || 0,
                totalAnswered,
                maxUnlocked,
                levelDetails,
                lastLoginAt: user.lastLoginAt,
                createdAt: user.createdAt
            };
        });
        
        res.json(summary);
    } catch (error) {
        console.error('Users summary error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== LEADERBOARD ROUTES ====================

// Get leaderboard
app.get('/api/leaderboard/:period', async (req, res) => {
    try {
        const { period } = req.params;
        const limit = parseInt(req.query.limit) || 100;

        const leaderboard = await Leaderboard.find({ period })
            .sort({ score: -1 })
            .limit(limit)
            .populate('userId', 'username displayName characterId');

        res.json(leaderboard);
    } catch (error) {
        console.error('Leaderboard fetch error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update leaderboard
app.post('/api/leaderboard', authenticateToken, async (req, res) => {
    try {
        const { score, level, period } = req.body;

        const user = await User.findById(req.user.userId);

        const entry = await Leaderboard.findOneAndUpdate(
            { userId: req.user.userId, period },
            {
                username: user.username,
                displayName: user.displayName,
                characterId: user.characterId,
                score,
                level,
                date: new Date()
            },
            { new: true, upsert: true }
        );

        res.json({
            message: 'Leaderboard updated',
            entry
        });
    } catch (error) {
        console.error('Leaderboard update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== SERVER START ====================

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
