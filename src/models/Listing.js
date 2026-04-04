import mongoose from 'mongoose';

const ListingSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['hotel', 'restaurant', 'bar', 'bujtina', 'rentcar', 'tour', 'city'],
        required: true,
    },
    title: {
        type: String,
        required: false,
    },
    slug: {
        type: String,
        required: false,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String, // Now supports HTML from rich text editor
        required: false,
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
        type: String, // Main image URL path
    },
    gallery: {
        type: [String], // Array of additional image URLs
        default: [],
    },
    lat: {
        type: Number,
    },
    lng: {
        type: Number,
    },
    whatsappNumber: {
        type: String, // Global whatsapp number for all types
        required: false,
    },
    city: {
        type: String, // Global city field
        required: false,
    },
    country: {
        type: String, // Global country field
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    views: {
        type: Number,
        default: 0,
    },
    scanCount: {
        type: Number,
        default: 0,
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
    },
    // Tour specific fields
    tourData: {
        duration: { type: String }, // e.g. "3 Days", "5 Hours"
        country: { type: String }, // Location/Country
        maxTravelers: { type: Number },
        itinerary: {
            type: [{ day: Number, content: String }],
            default: []
        },
        inclusions: { type: [String], default: [] }, // "Transport", "Lunch", "Guide"
        exclusions: { type: [String], default: [] }, // "Personal expenses", "Tips"
        calendar: { type: String }, // Available dates or link to calendar
        price: { type: String }, // Keep as string for display, but use pricing for calculator
        pricing: {
            adultPrice: { type: Number, default: 0 },
            childPrice: { type: Number, default: 0 },
            fixedPrice: { type: Number, default: 0 },
            isGroupWise: { type: Boolean, default: false }
        },
        extras: {
            type: [{ name: String, price: Number }],
            default: []
        },
        whatsappNumber: { type: String },
    },
    // City specific fields
    cityData: {
        country: { type: String },
        population: { type: String },
        bestTimeToVisit: { type: String }
    }
});

// Force recompilation of model to apply schema changes (like required: false) in development
if (mongoose.models.Listing) {
    delete mongoose.models.Listing;
}

export default mongoose.models.Listing || mongoose.model('Listing', ListingSchema);
