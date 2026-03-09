const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    unlockedLevels: {
        type: [Number],
        default: [1]
    },
    levelScores: {
        type: Map,
        of: Number,
        default: {}
    },
    answeredWords: {
        type: Map,
        of: [String],
        default: {}
    },
    additionalVowels: {
        type: [String],
        default: []
    },
    additionalConsonants: {
        type: [String],
        default: []
    },
    additionalTones: {
        type: [String],
        default: []
    },
    completedLevels: {
        type: [Number],
        default: []
    },
    currentLevel: {
        type: Number,
        default: 1
    },
    totalStars: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    accuracyRate: {
        type: Number,
        default: 100
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
progressSchema.index({ userId: 1 });

module.exports = mongoose.model('Progress', progressSchema);
