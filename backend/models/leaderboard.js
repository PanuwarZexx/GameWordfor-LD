const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    username: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        required: true
    },
    characterId: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    period: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'allTime'],
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for leaderboard queries
leaderboardSchema.index({ period: 1, score: -1 });
leaderboardSchema.index({ userId: 1, period: 1 });

module.exports = mongoose.model('Leaderboard', leaderboardSchema);
