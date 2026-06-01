import mongoose from 'mongoose';

const BudgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    budget: {
        type: String,
        required: true,
    },
    whatsappNumber: {
        type: String,
        required: false,
    },
    instagramLink: {
        type: String,
        required: false,
    },
    facebookLink: {
        type: String,
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Force recompilation of model to apply schema changes in development
if (mongoose.models.Budget) {
    delete mongoose.models.Budget;
}

export default mongoose.models.Budget || mongoose.model('Budget', BudgetSchema);
