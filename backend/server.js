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
const PlayLog = require('./models/playlog');

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
        'http://project-com-tech.ubru.ac.th',
        'https://panuwarzexx.github.io'
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

// Role-checking Middleware
const requireRole = (...roles) => {
    return async (req, res, next) => {
        try {
            const user = await User.findById(req.user.userId).select('role');
            if (!user || !roles.includes(user.role)) {
                return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' });
            }
            req.userRole = user.role;
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Server error' });
        }
    };
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
                totalScore: user.totalScore,
                role: user.role || 'student'
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
// ==================== ADMIN ROUTES ====================

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create user (admin only)
app.post('/api/admin/users', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { username, password, displayName, role, characterId, studentId, classroom } = req.body;

        const existing = await User.findOne({ username });
        if (existing) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword,
            displayName,
            characterId: characterId || 1,
            characterImage: `${characterId || 1}.png`,
            role: role || 'student',
            studentId: studentId || '',
            classroom: classroom || ''
        });

        await user.save();

        if (role === 'student' || !role) {
            const progress = new Progress({
                userId: user._id,
                unlockedLevels: [1],
                levelScores: {},
                answeredWords: {}
            });
            await progress.save();
        }

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                username: user.username,
                displayName: user.displayName,
                role: user.role,
                characterId: user.characterId
            }
        });
    } catch (error) {
        console.error('Admin create user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user role (admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { role } = req.body;
        if (!['admin', 'teacher', 'student'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Role updated', user });
    } catch (error) {
        console.error('Admin update role error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit user (admin only) - update displayName, password, role
app.put('/api/admin/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const { displayName, password, role, studentId, classroom } = req.body;
        const updateFields = {};

        if (displayName) updateFields.displayName = displayName;
        if (role && ['admin', 'teacher', 'student'].includes(role)) updateFields.role = role;
        if (password) updateFields.password = await bcrypt.hash(password, 10);
        if (studentId !== undefined) updateFields.studentId = studentId;
        if (classroom !== undefined) updateFields.classroom = classroom;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User updated', user });
    } catch (error) {
        console.error('Admin edit user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireRole('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user._id.toString() === req.user.userId) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await Progress.deleteMany({ userId: user._id });
        await PlayLog.deleteMany({ userId: user._id });
        await Leaderboard.deleteMany({ userId: user._id });
        await User.findByIdAndDelete(req.params.id);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== TEACHER ROUTES ====================

// Get all students with progress summary (teacher/admin)
app.get('/api/teacher/students', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const students = await User.find({ role: 'student' }).select('-password').sort({ lastLoginAt: -1 });
        const userIds = students.map(u => u._id);
        const progressList = await Progress.find({ userId: { $in: userIds } }).lean();

        const progressMap = {};
        progressList.forEach(p => {
            progressMap[p.userId.toString()] = p;
        });

        const result = students.map(student => {
            const progress = progressMap[student._id.toString()] || {};
            const answeredWords = progress.answeredWords || {};

            let totalAnswered = 0;
            const levelDetails = {};
            for (let level = 1; level <= 10; level++) {
                const key = String(level);
                const wordsList = answeredWords[key] || (answeredWords.get ? answeredWords.get(key) : null);
                const answered = wordsList && Array.isArray(wordsList) ? wordsList.length : 0;
                totalAnswered += answered;
                levelDetails[key] = answered;
            }

            const unlockedLevels = progress.unlockedLevels || [1];
            const maxUnlocked = Array.isArray(unlockedLevels) && unlockedLevels.length > 0 ? Math.max(...unlockedLevels) : 1;

            return {
                id: student._id,
                username: student.username,
                displayName: student.displayName,
                characterId: student.characterId,
                totalScore: student.totalScore || 0,
                totalAnswered,
                maxUnlocked,
                levelDetails,
                lastLoginAt: student.lastLoginAt,
                createdAt: student.createdAt
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Teacher get students error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get detailed report for a specific student (teacher/admin)
app.get('/api/teacher/students/:id', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const student = await User.findById(req.params.id).select('-password');
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const progress = await Progress.findOne({ userId: student._id }).lean();
        const playLogs = await PlayLog.find({ userId: student._id }).sort({ playedAt: -1 }).lean();

        const logsByLevel = {};
        playLogs.forEach(log => {
            const key = String(log.level);
            if (!logsByLevel[key]) logsByLevel[key] = [];
            logsByLevel[key].push({
                wordIndex: log.wordIndex,
                word: log.word,
                userAnswer: log.userAnswer,
                isCorrect: log.isCorrect,
                errorType: log.errorType,
                playedAt: log.playedAt
            });
        });

        const totalAttempts = playLogs.length;
        const correctAttempts = playLogs.filter(l => l.isCorrect).length;
        const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        res.json({
            student: {
                id: student._id,
                username: student.username,
                displayName: student.displayName,
                characterId: student.characterId,
                totalScore: student.totalScore || 0,
                lastLoginAt: student.lastLoginAt,
                createdAt: student.createdAt
            },
            progress: progress || {},
            stats: {
                totalAttempts,
                correctAttempts,
                wrongAttempts: totalAttempts - correctAttempts,
                accuracy
            },
            logsByLevel
        });
    } catch (error) {
        console.error('Teacher get student detail error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get student play history for trend analysis (teacher/admin)
app.get('/api/teacher/students/:id/history', authenticateToken, requireRole('teacher', 'admin'), async (req, res) => {
    try {
        const playLogs = await PlayLog.find({ userId: req.params.id })
            .sort({ playedAt: 1 })
            .lean();

        const dailyStats = {};
        playLogs.forEach(log => {
            const dateKey = new Date(log.playedAt).toISOString().split('T')[0];
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { total: 0, correct: 0, wrong: 0 };
            }
            dailyStats[dateKey].total++;
            if (log.isCorrect) {
                dailyStats[dateKey].correct++;
            } else {
                dailyStats[dateKey].wrong++;
            }
        });

        res.json({
            dailyStats,
            totalLogs: playLogs.length
        });
    } catch (error) {
        console.error('Teacher get history error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== PLAY LOG ROUTE ====================

// Log a play attempt (any authenticated user)
app.post('/api/progress/log', authenticateToken, async (req, res) => {
    try {
        const { level, wordIndex, word, userAnswer, isCorrect, errorType } = req.body;

        const log = new PlayLog({
            userId: req.user.userId,
            level,
            wordIndex,
            word,
            userAnswer,
            isCorrect,
            errorType: errorType || ''
        });

        await log.save();
        res.status(201).json({ message: 'Play logged' });
    } catch (error) {
        console.error('Play log error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// ==================== AUTO SEED ADMIN ====================

async function seedAdmin() {
    try {
        const existing = await User.findOne({ username: 'admin' });
        if (existing) {
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                await existing.save();
                console.log('✅ Updated existing admin role');
            }
            return;
        }

        const hashedPassword = await bcrypt.hash('admin1234', 10);
        const admin = new User({
            username: 'admin',
            password: hashedPassword,
            displayName: 'ผู้ดูแลระบบ',
            characterId: 1,
            characterImage: '1.png',
            role: 'admin'
        });
        await admin.save();
        console.log('✅ Admin created: admin / admin1234');
    } catch (error) {
        console.error('Seed admin error:', error);
    }
}

// ==================== SERVER START ====================

app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await seedAdmin();
});
