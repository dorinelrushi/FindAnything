import mongoose from 'mongoose';

const ScanSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
    },
    deviceId: {
        type: String,
        required: true,
    },
    deviceFingerprint: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound indexes for fast checking of uniqueness
ScanSchema.index({ listingId: 1, deviceId: 1 });
ScanSchema.index({ listingId: 1, deviceFingerprint: 1 });

// Force recompilation of model to apply schema changes in development
if (mongoose.models.Scan) {
    delete mongoose.models.Scan;
}

export default mongoose.models.Scan || mongoose.model('Scan', ScanSchema);
