import mongoose from 'mongoose';

const AdSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
    },
    plan: {
        type: String,
        enum: ['1_week', '2_weeks'],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'expired'],
        default: 'pending',
    },
    content: {
        title: { type: String, required: true },
        description: { type: String, required: true },
        photos: { type: [String], default: [] },
        whatsapp: { type: String },
        phone: { type: String },
        socialMedia: {
            facebook: { type: String },
            instagram: { type: String },
            website: { type: String }
        },
        buttonText: { type: String, default: 'Contact Now' }, // Call Now, Reservation, etc.
    },
    paymentId: {
        type: String, // PayPal Order ID
    },
    views: {
        type: Number,
        default: 0,
    },
    clicks: {
        type: Number,
        default: 0,
    },
    viewedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    clickedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export default mongoose.models.Ad || mongoose.model('Ad', AdSchema);
