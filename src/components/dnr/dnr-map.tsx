"use client";

import "leaflet/dist/leaflet.css";

import { useEffect } from "react";

import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, useMap } from "react-leaflet";

// Fix leaflet default marker icons in Next.js
const blueIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  iconRetinaUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface DnrMapProps {
  planned: { lat: number; lng: number };
  actual: { lat: number; lng: number };
}

function FitBounds({ planned, actual }: DnrMapProps) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds([
      [planned.lat, planned.lng],
      [actual.lat, actual.lng],
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
  }, [map, planned, actual]);
  return null;
}

export default function DnrMap({ planned, actual }: DnrMapProps) {
  const center: [number, number] = [(planned.lat + actual.lat) / 2, (planned.lng + actual.lng) / 2];

  return (
    <MapContainer center={center} zoom={17} className="h-[200px] w-full rounded-lg" scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[planned.lat, planned.lng]} icon={blueIcon} />
      <Marker position={[actual.lat, actual.lng]} icon={redIcon} />
      <Polyline
        positions={[
          [planned.lat, planned.lng],
          [actual.lat, actual.lng],
        ]}
        color="#ef4444"
        dashArray="6"
        weight={2}
      />
      <FitBounds planned={planned} actual={actual} />
    </MapContainer>
  );
}
