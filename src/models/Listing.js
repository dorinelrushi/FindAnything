import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['hotel', 'restaurant', 'bar', 'bujtina', 'rentcar'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String, // Now supports HTML from rich text editor
        required: true,
    },
    category: {
        type: String, // e.g., "Traditional", "Fast Food", "Pizzeria", "Bar & Grill"
        required: false,
    },
    services: {
        type: [String], // e.g., ["Wi-Fi falas", "Parkim", "Rezervime", "Delivery"]
        default: [],
    },
    address: {
        type: String,
        required: false,
    },
    image: {
        type: String, // URL path
    },
    lat: {
        type: Number,
    },
    lng: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    // Hotel-specific fields
    hotelData: {
        totalRooms: { type: Number },
        roomTypes: { type: [String], default: [] }, // e.g., ["Single", "Double", "Suite"]
        roomAmenities: { type: [String], default: [] }, // e.g., ["Wi-Fi falas", "TV", "Ajër i kondicionuar"]
        generalServices: { type: [String], default: [] }, // e.g., ["Reception 24/7", "Wi-Fi falas"]
        additionalServices: { type: [String], default: [] }, // e.g., ["Transfer aeroporti", "Laundry"]
        policies: {
            cancellation: { type: String },
            children: { type: String },
            pets: { type: String },
            payment: { type: String }
        }
    },
    // Bar-specific fields
    barData: {
        category: { type: String },
        atmosphere: { type: [String], default: [] },
        services: { type: [String], default: [] },
        rules: {
            minAge: { type: String, default: '18+' },
            suitableFor: { type: [String], default: [] },
            smokingArea: { type: String }
        },
        features: {
            featuredDrinks: { type: Boolean, default: false },
            openLate: { type: Boolean, default: false },
            liveMusicTonight: { type: Boolean, default: false },
            cocktailOfWeek: { type: String }
        }
    },
    // Bujtina-specific fields
    bujtinaData: {
        accommodationType: { type: String, enum: ['Bujtinë', 'Guesthouse', 'Agroturizëm'] },
        style: { type: [String], default: [] }, // Tradicional, Rustik, Familjar
        totalRooms: { type: Number },
        roomTypes: { type: [String], default: [] }, // Double, Triple, Family Room
        roomAmenities: { type: [String], default: [] }, // Ngrohje, Banjo private, etc.
        facilities: { type: [String], default: [] }, // Parkim falas, Ambient i jashtëm, Zjarr/oxhak
        food: {
            breakfast: { type: String, default: 'Po (produkte shtëpie)' },
            meals: { type: String, default: 'Ushqim tradicional korçar' },
            bioProducts: { type: [String], default: [] } // Djathë, qumësht, reçel, bukë shtëpie
        }
    },
    // Rent Car specific fields
    rentCarData: {
        brandModel: { type: String }, // Volkswagen Golf
        year: { type: Number }, // 2018
        category: { type: [String], default: [] }, // Ekonomike, Kompakte, SUV, etc.
        fuelType: { type: String }, // Naftë, Benzinë, etc.
        transmission: { type: String }, // Manual, Automatik
        seats: { type: Number },
        airConditioning: { type: Boolean, default: true },
        fuelConsumption: { type: String }, // 5L / 100km
        prices: {
            daily: { type: String },
            weekly: { type: String },
            deposit: { type: String },
            inclusions: { type: [String], default: [] } // Siguracion bazë, Kilometra pa limit
        },
        conditions: {
            minAge: { type: String }, // 21 vjec
            licenseExperience: { type: String }, // Minimum 2 vite
            requiredDocuments: { type: [String], default: [] },
            paymentMethods: { type: [String], default: [] }
        },
        availability: {
            status: { type: String, default: 'E lirë' }, // E lirë, E rezervuar
            dates: { type: String } // From - To string for simplicity
        },
        extraServices: { type: [String], default: [] } // GPS, Karrige për fëmijë, etc.
    }
});

// Force recompilation of model to apply schema changes (like required: false) in development
if (mongoose.models.Listing) {
    delete mongoose.models.Listing;
}

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
