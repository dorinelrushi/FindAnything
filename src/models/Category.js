import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
    type: { type: String, required: true },
    name: { type: String, required: true },
});

// Force recompilation in dev
if (mongoose.models.Category) {
    delete mongoose.models.Category;
}

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);
