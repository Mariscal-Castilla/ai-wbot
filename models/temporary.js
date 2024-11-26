import mongoose from 'mongoose'

const TEMPORARY_SCHEMA = new mongoose.Schema({
    user: {
        type: String,
        required: true,
        unique: true
    },
    history: [{
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    expiry: {
        type: Date,
        required: true
    }
}, {
    timestamps: true,
    collection: "TEMPORARY_CONVERSATION",
    versionKey: false 
});

export const TEMPORARY_CONVERSATION = mongoose.model('TemporaryConversation', TEMPORARY_SCHEMA);