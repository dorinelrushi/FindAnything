import mongoose from 'mongoose';

const ScanSchema = new mongoose.Schema({
    listingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
        index: true,
    },
    deviceId: {
        type: String,
        required: false,
        default: '',
    },
    deviceFingerprint: {
        type: String,
        required: false,
        default: '',
    },
    // One scan per IP per listing (primary anti-abuse rule)
    ip: {
        type: String,
        required: true,
        index: true,
    },
    country: {
        type: String,
        default: '',
    },
    countryCode: {
        type: String,
        default: '',
    },
    region: {
        type: String,
        default: '',
    },
    city: {
        type: String,
        default: '',
    },
    timezone: {
        type: String,
        default: '',
    },
    userAgent: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
});

// One successful scan per IP per listing
ScanSchema.index({ listingId: 1, ip: 1 }, { unique: true });
// Keep device indexes for extra protection when IP is shared/NAT
ScanSchema.index({ listingId: 1, deviceId: 1 });
ScanSchema.index({ listingId: 1, deviceFingerprint: 1 });

if (mongoose.models.Scan) {
    delete mongoose.models.Scan;
}

export default mongoose.models.Scan || mongoose.model('Scan', ScanSchema);
