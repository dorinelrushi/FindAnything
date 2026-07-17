const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

function detectLocation(message, dbCities, dbCountries) {
    const lowerMessage = String(message || '').toLowerCase();
    const sortedCities = [...dbCities].filter(Boolean).map(c => String(c).trim()).sort((a, b) => b.length - a.length);
    const sortedCountries = [...dbCountries].filter(Boolean).map(c => String(c).trim()).sort((a, b) => b.length - a.length);
    for (const city of sortedCities) {
        const cleanCity = city.toLowerCase();
        const stem = cleanCity.replace(/[aeë\s]$/, '');
        if (stem.length >= 3 && lowerMessage.includes(stem)) {
            return { type: 'city', value: city, stem };
        }
    }
    for (const country of sortedCountries) {
        const cleanCountry = country.toLowerCase();
        const stem = cleanCountry.replace(/[aeë\s]$/, '');
        if (stem.length >= 3 && lowerMessage.includes(stem)) {
            return { type: 'country', value: country, stem };
        }
    }
    return null;
}

const NEGATIVE_PHRASES = ['not allowed', 'no pets', 'not accepted', 'forbidden', 'prohibited', 'no animals',
    'nuk lejohet', 'nuk pranohet', 'jo', 'non ammessi', 'nicht erlaubt', 'non acceptés',
    'no se permiten', 'yasak'];
const POSITIVE_WORDS_NO_ALLOWED = ['welcome', 'accepted', 'yes', 'ok', 'permitted', 'friendly',
    'lejuar', 'po', 'pranohet', 'pranohen', 'mirëpritur', 'mirepritur',
    'ammessi', 'ammesso', 'sì', 'si', 'erlaubt', 'acceptés', 'aceptado', 'kabul'];

function scoreAmenityMatch(listing, amenities) {
    if (!amenities.length) return 0;
    const blob = (listing.searchText || '').toLowerCase();
    let score = 0;

    for (const key of amenities) {
        if (key !== 'pets') continue;

        const petsPolicy = (listing.policies?.pets || '').toLowerCase();
        const combinedText = (petsPolicy + ' ' + blob).toLowerCase();

        // Check for pet term in blob
        const petTerms = ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'animal', 'animals'];
        const hasPetTerm = petTerms.some((t) => blob.includes(t));

        if (!hasPetTerm) {
            // No pet term in searchText, rely on petsPolicy field
            if (!petsPolicy) { score -= 1; continue; }
            const isNeg = NEGATIVE_PHRASES.some((n) => petsPolicy.includes(n)) ||
                /not allowed|forbidden|prohibited/i.test(petsPolicy);
            if (isNeg) { score -= 20; continue; }
            const isPos = POSITIVE_WORDS_NO_ALLOWED.some((p) => petsPolicy.includes(p)) ||
                /\bpets? allowed\b|\bpet.?friendly\b|\bwelcome\b|\bpermitted\b|\blejuar\b|\bpranohet\b/i.test(petsPolicy);
            if (isPos) score += 25;
            else score += 5;
            continue;
        }

        // Has pet term in searchText — check combined text for final verdict
        const isNeg = NEGATIVE_PHRASES.some((n) => combinedText.includes(n)) ||
            /not allowed|no pets|forbidden|prohibited|not accepted/i.test(combinedText);
        if (isNeg) { score -= 25; continue; }
        const isPos = POSITIVE_WORDS_NO_ALLOWED.some((p) => combinedText.includes(p)) ||
            /\bpets? allowed\b|\bpet.?friendly\b|\bwelcome\b|\bpermitted\b|\blejuar\b|\bpranohet\b/i.test(combinedText);
        if (isPos) score += 30;
        else score += 8;
    }

    return score;
}

(async () => {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const Listing = mongoose.connection.collection('listings');

  const cities = await Listing.distinct('city');
  const countries = await Listing.distinct('country');
  console.log('DB Cities:', cities);
  console.log('DB Countries:', countries);

  const queries = [
    'I want some hotels that allow pets in tirana',
    'pet friendly hotel in Tirane',
    'hotels in Korcë',
    'hotels in korca',
    'bujtina in Vlore',
    'some chat greeting'
  ];

  console.log('\n--- TESTING LOCATION DETECTION ---');
  for (const q of queries) {
    const loc = detectLocation(q, cities, countries);
    console.log(`Query: "${q}" -> Detected:`, loc);
  }

  console.log('\n--- TESTING TIRANA HOTELS PET SCORING ---');
  const tiranaHotels = await Listing.find({
    city: { $regex: /tiran/i },
    type: 'hotel'
  }).toArray();

  for (const h of tiranaHotels) {
    const petsPolicy = h.hotelData?.policies?.pets || '';
    const mockListing = {
      title: h.title,
      policies: { pets: petsPolicy },
      // Simulate searchText: title + description + policy
      searchText: `${h.title} ${h.description || ''} ${petsPolicy}`.toLowerCase()
    };
    const score = scoreAmenityMatch(mockListing, ['pets']);
    console.log(`  Hotel: "${h.title}"`);
    console.log(`    Pets Policy: "${petsPolicy}"`);
    console.log(`    Score: ${score}  =>  ${score > 0 ? '✅ PET-FRIENDLY' : score < 0 ? '❌ NOT ALLOWED' : '⚠️  UNKNOWN'}`);
  }

  console.log('\n--- TESTING ALL HOTELS SCORING ---');
  const allHotels = await Listing.find({ type: { $in: ['hotel', 'bujtina'] } }).toArray();
  for (const h of allHotels) {
    const petsPolicy = h.hotelData?.policies?.pets || h.bujtinaData?.food?.breakfast || '';
    const mockListing = {
      title: h.title,
      city: h.city,
      policies: { pets: petsPolicy },
      searchText: `${h.title} ${h.city} ${h.description || ''} ${petsPolicy}`.toLowerCase()
    };
    const score = scoreAmenityMatch(mockListing, ['pets']);
    const verdict = score > 0 ? '✅' : score < 0 ? '❌' : '⚠️';
    console.log(`  ${verdict} ${h.title} (${h.city}) | policy="${petsPolicy}" | score=${score}`);
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
