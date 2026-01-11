'use client';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icons in Next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper to parse coordinates safely
const parseCoord = (val) => {
    if (val === undefined || val === null) return NaN;
    if (typeof val === 'number') return val;
    // Replace comma with dot for locales
    const str = val.toString().replace(',', '.');
    return parseFloat(str);
};

// Routing Machine Component
function RoutingMachine({ start, end }) {
    const map = useMap();

    useEffect(() => {
        if (!map || !start || !end) return;

        let isMounted = true;
        let routingControl = null;

        // Ensure L is globally available for the plugin
        if (typeof window !== 'undefined' && !window.L) {
            window.L = L;
        }

        const loadRoutingMachine = async () => {
            // Load CSS if needed
            if (!document.querySelector('link[href*="leaflet-routing-machine.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.css';
                document.head.appendChild(link);
            }

            // Load JS if not present
            if (!L.Routing) {
                try {
                    await new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = 'https://unpkg.com/leaflet-routing-machine@latest/dist/leaflet-routing-machine.js';
                        script.onload = resolve;
                        script.onerror = reject;
                        document.body.appendChild(script);
                    });
                } catch (e) {
                    console.error("Failed to load routing machine script", e);
                    return;
                }
            }

            if (isMounted) {
                initRouting();
            }
        };

        const initRouting = () => {
            if (!L.Routing) return;

            // Double check cleanup
            if (routingControl) {
                try { map.removeControl(routingControl); } catch (e) { }
            }

            try {
                routingControl = L.Routing.control({
                    waypoints: [
                        L.latLng(parseFloat(start.lat), parseFloat(start.lng)),
                        L.latLng(parseFloat(end.lat), parseFloat(end.lng))
                    ],
                    routeWhileDragging: true,
                    lineOptions: {
                        styles: [{ color: 'blue', opacity: 0.7, weight: 5 }]
                    },
                    altLineOptions: {
                        styles: [{ color: 'gray', opacity: 0.5, weight: 4, dashArray: '5,10' }]
                    },
                    showAlternatives: true,
                    addWaypoints: false,
                    fitSelectedRoutes: true,
                    show: false // Hide the turn-by-turn directions table
                }).addTo(map);
            } catch (e) {
                console.error("Leaflet Routing Machine init error", e);
            }
        };

        loadRoutingMachine();

        return () => {
            isMounted = false;
            if (map && routingControl) {
                try {
                    map.removeControl(routingControl);
                } catch (e) {
                    // Ignore removal errors
                }
            }
        };
    }, [map, start, end]);

    return null;
}

function MapResizer() {
    const map = useMap();
    useEffect(() => {
        // Force map to recalculate its container size after initial render
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 50);
        return () => clearTimeout(timer);
    }, [map]);
    return null;
}



const Map = ({ listings, startPoint, endPoint }) => {
    const defaultPosition = [40.6186, 20.7808]; // Korca

    return (
        <MapContainer
            center={defaultPosition}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            preferCanvas={true}
            zoomAnimation={true}
            markerZoomAnimation={true}
            tap={false} // Faster clicks on mobile
            bounceAtZoomLimits={false}
        >
            <MapResizer />
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                updateWhenZooming={false}
                updateWhenIdle={true}
                keepBuffer={4}
            />
            <style jsx global>{`
                .leaflet-routing-container {
                    display: none !important;
                }
            `}</style>
            {listings.map((listing) => {
                const lat = parseCoord(listing.lat);
                const lng = parseCoord(listing.lng);

                if (isNaN(lat) || isNaN(lng)) return null;

                return (
                    <Marker key={listing._id} position={[lat, lng]}>
                        <Popup>
                            <b>{listing.title}</b><br />
                            {listing.type}
                        </Popup>
                    </Marker>
                );
            })}

            {/* Only render if start coordinate valid and no end point */}
            {!isNaN(parseCoord(startPoint?.lat)) && !isNaN(parseCoord(startPoint?.lng)) && !endPoint && (
                <Marker position={[parseCoord(startPoint.lat) || 0, parseCoord(startPoint.lng) || 0]}>
                    <Popup>Start Point</Popup>
                </Marker>
            )}

            {/* Only render route if BOTH are valid */}
            {!isNaN(parseCoord(startPoint?.lat)) && !isNaN(parseCoord(startPoint?.lng)) &&
                !isNaN(parseCoord(endPoint?.lat)) && !isNaN(parseCoord(endPoint?.lng)) && (
                    <RoutingMachine
                        start={{ lat: parseCoord(startPoint.lat), lng: parseCoord(startPoint.lng) }}
                        end={{ lat: parseCoord(endPoint.lat), lng: parseCoord(endPoint.lng) }}
                    />
                )}
        </MapContainer>
    );
};

export default Map;
