import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    content: {
        type: String, // Rich HTML content
        required: true,
    },
    excerpt: {
        type: String, // Short description for SEO / listing cards
        default: '',
    },
    coverImage: {
        type: String, // URL of the cover image
        default: '',
    },
    tags: {
        type: [String],
        default: [],
    },
    seoTitle: {
        type: String, // Custom SEO title (optional)
        default: '',
    },
    seoDescription: {
        type: String, // Custom meta description (optional)
        default: '',
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    published: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Delete cached model in development
if (mongoose.models.Blog) {
    delete mongoose.models.Blog;
}

export default mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
