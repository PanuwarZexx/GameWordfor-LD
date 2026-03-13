const mongoose = require('mongoose');

const playLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    level: {
        type: Number,
        required: true
    },
    wordIndex: {
        type: Number,
        required: true
    },
    word: {
        type: String,
        required: true
    },
    userAnswer: {
        type: String,
        required: true
    },
    isCorrect: {
        type: Boolean,
        required: true
    },
    errorType: {
        type: String,
        default: ''
    },
    playedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for faster queries
playLogSchema.index({ userId: 1, playedAt: -1 });
playLogSchema.index({ userId: 1, level: 1 });

module.exports = mongoose.model('PlayLog', playLogSchema);
