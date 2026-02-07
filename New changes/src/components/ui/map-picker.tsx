"use client";

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin } from 'lucide-react';

// Fix for default marker icon missing in React Leaflet
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

interface MapPickerProps {
    value?: { lat: number; lng: number };
    onChange: (value: { lat: number; lng: number }) => void;
}

function LocationMarker({ value, onChange }: MapPickerProps) {
    const map = useMapEvents({
        click(e) {
            onChange(e.latlng);
            map.flyTo(e.latlng, map.getZoom());
        },
    });

    useEffect(() => {
        if (value) {
            map.flyTo(value, map.getZoom());
        }
    }, [value, map]);

    return value === undefined ? null : (
        <Marker position={value} icon={icon}></Marker>
    );
}

export default function MapPicker({ value, onChange }: MapPickerProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleGetCurrentLocation = () => {
        setGettingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    onChange({ lat: latitude, lng: longitude });
                    setGettingLocation(false);
                },
                (error) => {
                    console.error("Error getting location: ", error);
                    setGettingLocation(false);
                }
            );
        } else {
            console.error("Geolocation is not supported by this browser.");
            setGettingLocation(false);
        }
    };


    if (!isMounted) {
        return <div className="h-[300px] w-full rounded-md border bg-muted flex items-center justify-center">Loading Map...</div>;
    }

    const defaultCenter = value || { lat: 31.5204, lng: 74.3587 }; // Default to Lahore

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pin Location on Map</span>
                <Button type="button" variant="outline" size="sm" onClick={handleGetCurrentLocation} disabled={gettingLocation}>
                    {gettingLocation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                    Use My Location
                </Button>
            </div>
            <div className="h-[300px] w-full rounded-md overflow-hidden border relative z-0">
                <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker value={value} onChange={onChange} />
                </MapContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center">Tap on the map to set precise location</p>
        </div>
    );
}
