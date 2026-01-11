import mongoose from 'mongoose';

const MenuSchema = new mongoose.Schema({
    listing: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Listing',
        required: true,
        unique: true, // One menu per listing
    },
    categories: [{
        name: {
            type: String,
            required: true,
        },
        items: [{
            name: {
                type: String,
                required: true,
            },
            price: {
                type: String,
                required: true,
            },
            photo: {
                type: String, // URL
            },
            description: {
                type: String,
            },
        }]
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

if (mongoose.models.Menu) {
    delete mongoose.models.Menu;
}

export default mongoose.models.Menu || mongoose.model('Menu', MenuSchema);
