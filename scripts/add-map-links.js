/**
 * Append a "Show on map" link to each listing description.
 * Query uses business title + street address (+ city/country when available).
 * Prefer name+address over lat/lng because many listings share default coords.
 *
 * Usage:
 *   node scripts/add-map-links.js          # dry-run
 *   node scripts/add-map-links.js --apply  # write to DB
 */
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

const MAP_MARKER = 'data-ttfe-map-link="1"';

function buildMapQuery(listing) {
  const parts = [listing.title, listing.address, listing.city, listing.country]
    .map((v) => (v || '').toString().trim())
    .filter(Boolean);
  // Deduplicate consecutive identical parts (e.g. address already includes city)
  const unique = [];
  for (const p of parts) {
    if (!unique.some((u) => u.toLowerCase() === p.toLowerCase())) unique.push(p);
  }
  return unique.join(', ');
}

function buildMapUrl(listing) {
  const query = buildMapQuery(listing);
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function hasOurMapLink(description) {
  return (description || '').includes(MAP_MARKER) || /google\.com\/maps\/search/i.test(description || '');
}

function buildMapLinkHtml(listing, mapUrl) {
  const label = listing.address
    ? `📍 Show on map — ${listing.title}, ${listing.address}`
    : `📍 Show on map — ${listing.title}${listing.city ? `, ${listing.city}` : ''}`;

  return (
    `<p ${MAP_MARKER} style="margin-top:1rem;">` +
    `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" ` +
    `style="color:#FF385C;font-weight:600;text-decoration:underline;">` +
    `${label}</a></p>`
  );
}

function appendMapLink(description, listing, mapUrl) {
  const linkHtml = buildMapLinkHtml(listing, mapUrl);
  const base = (description || '').trim();
  if (!base) return linkHtml;
  // Avoid double-append if re-run
  if (hasOurMapLink(base)) return base;
  return `${base}\n\n${linkHtml}`;
}

(async () => {
  loadEnv();
  const apply = process.argv.includes('--apply');

  await mongoose.connect(process.env.MONGODB_URI);
  const Listing = mongoose.connection.collection('listings');

  const listings = await Listing.find({})
    .project({
      title: 1,
      address: 1,
      city: 1,
      country: 1,
      description: 1,
      type: 1,
    })
    .toArray();

  let updated = 0;
  let skipped = 0;
  let noLocation = 0;

  for (const listing of listings) {
    const mapUrl = buildMapUrl(listing);
    if (!mapUrl) {
      noLocation++;
      console.log(`SKIP (no name/address): ${listing._id}`);
      continue;
    }

    if (hasOurMapLink(listing.description)) {
      skipped++;
      console.log(`SKIP (already has map link): ${listing.title}`);
      continue;
    }

    const newDescription = appendMapLink(listing.description, listing, mapUrl);
    const query = buildMapQuery(listing);

    console.log(`${apply ? 'UPDATE' : 'DRY'}: ${listing.title}`);
    console.log(`  query: ${query}`);
    console.log(`  url:   ${mapUrl}`);

    if (apply) {
      await Listing.updateOne(
        { _id: listing._id },
        { $set: { description: newDescription } }
      );
    }
    updated++;
  }

  console.log('\n--- Summary ---');
  console.log(`Total: ${listings.length}`);
  console.log(`${apply ? 'Updated' : 'Would update'}: ${updated}`);
  console.log(`Skipped (already linked): ${skipped}`);
  console.log(`Skipped (no location): ${noLocation}`);
  if (!apply) {
    console.log('\nDry-run only. Re-run with --apply to write changes.');
  }

  await mongoose.disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
