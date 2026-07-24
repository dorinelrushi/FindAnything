const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const p = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

(async () => {
  loadEnv();
  await mongoose.connect(process.env.MONGODB_URI);
  const Listing = mongoose.connection.collection('listings');

  const total = await Listing.countDocuments({});
  const withAddr = await Listing.countDocuments({
    address: { $exists: true, $nin: [null, ''] },
  });
  const withCoords = await Listing.countDocuments({
    lat: { $exists: true, $ne: null },
    lng: { $exists: true, $ne: null },
  });

  const sample = await Listing.find({})
    .project({
      title: 1,
      address: 1,
      city: 1,
      country: 1,
      lat: 1,
      lng: 1,
      type: 1,
      description: 1,
    })
    .limit(20)
    .toArray();

  console.log(
    JSON.stringify(
      {
        total,
        withAddr,
        withCoords,
        sample: sample.map((s) => ({
          id: String(s._id),
          title: s.title,
          address: s.address,
          city: s.city,
          country: s.country,
          lat: s.lat,
          lng: s.lng,
          type: s.type,
          descPreview: (s.description || '').replace(/<[^>]*>/g, '').slice(0, 120),
          hasMapLink: /maps\.google|google\.com\/maps|openstreetmap/i.test(
            s.description || ''
          ),
        })),
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
