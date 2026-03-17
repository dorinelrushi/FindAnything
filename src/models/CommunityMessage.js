import mongoose from 'mongoose';

const CommunityMessageSchema = new mongoose.Schema({
    visitorId: {
        type: String,
        required: true,
        index: true,
    },
    visitorName: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: false,
        maxlength: 500, // Reasonable limit
    },
    category: {
        type: String,
        enum: ['hotel', 'restaurant', 'bar', 'guesthouse', 'rentcar', 'tour', 'city', 'general'],
        required: true,
        default: 'general',
    },
    attachments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: '24h' } // MongoDB TTL index to automatically delete documents 24 hours after creation
    }
});

if (mongoose.models.CommunityMessage) {
    delete mongoose.models.CommunityMessage;
}

export default mongoose.models.CommunityMessage || mongoose.model('CommunityMessage', CommunityMessageSchema);
