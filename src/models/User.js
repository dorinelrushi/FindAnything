import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
    },
    role: {
        type: String,
        enum: ['person', 'business', 'admin'],
        default: 'person',
    },
    name: {
        type: String,
    },
    phoneNumber: {
        type: String,
    },
    phonePrefix: {
        type: String,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'approved',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    interests: {
        hotel: { type: Number, default: 0 },
        restaurant: { type: Number, default: 0 },
        bar: { type: Number, default: 0 },
        bujtina: { type: Number, default: 0 },
        rentcar: { type: Number, default: 0 },
    },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
