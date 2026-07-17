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

(async () => {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const Listing = mongoose.connection.collection('listings');

  const cities = await Listing.aggregate([
    { $group: { _id: '$city', n: { $sum: 1 } } },
    { $sort: { n: -1 } },
    { $limit: 50 },
  ]).toArray();
  console.log('CITIES:', JSON.stringify(cities, null, 2));

  const hotels = await Listing.find({ type: 'hotel' })
    .project({
      title: 1,
      city: 1,
      country: 1,
      'hotelData.policies.pets': 1,
      services: 1,
    })
    .limit(30)
    .toArray();
  console.log('HOTELS:', JSON.stringify(hotels, null, 2));

  const tirana = await Listing.find({
    city: { $regex: /tiran/i },
  })
    .project({ title: 1, type: 1, city: 1, 'hotelData.policies.pets': 1 })
    .limit(20)
    .toArray();
  console.log('TIRANA:', JSON.stringify(tirana, null, 2));

  const korca = await Listing.find({
    city: { $regex: /kor/i },
  })
    .project({ title: 1, type: 1, city: 1, 'hotelData.policies.pets': 1 })
    .limit(20)
    .toArray();
  console.log('KORCA:', JSON.stringify(korca, null, 2));

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
