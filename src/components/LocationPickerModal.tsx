import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Search, Check, Layers, Plus, Minus, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LocationPickerModalProps {
  onClose: () => void;
  onConfirm: (address: string, lat: string, lng: string) => void;
  initialAddress?: string;
  initialLat?: string;
  initialLng?: string;
}

const MAP_STYLES = [
  { id: "satellite", label: "Satélite", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" },
  { id: "streets", label: "Ruas", url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" },
  { id: "topo", label: "Terreno", url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" },
];

const LABELS_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

const MARKER_HTML = `
  <div style="position:relative;width:44px;height:56px;">
    <div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);width:20px;height:6px;background:rgba(0,0,0,0.3);border-radius:50%;filter:blur(2px);"></div>
    <div style="position:absolute;inset:2px 2px auto 2px;width:40px;height:40px;background:hsl(245 60% 55% / 0.2);border-radius:50%;animation:marker-pulse 2s ease-out infinite;"></div>
    <svg viewBox="0 0 44 56" width="44" height="56" style="position:absolute;top:0;left:0;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.4));">
      <defs>
        <linearGradient id="pin-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(245 65% 65%)" />
          <stop offset="100%" stop-color="hsl(245 55% 42%)" />
        </linearGradient>
      </defs>
      <path d="M22 2C11 2 2 11 2 22c0 14 20 32 20 32s20-18 20-32C42 11 33 2 22 2z" fill="url(#pin-grad)" stroke="white" stroke-width="2.5"/>
      <circle cx="22" cy="20" r="8" fill="white" opacity="0.95"/>
      <circle cx="22" cy="20" r="4" fill="hsl(245 60% 55%)"/>
    </svg>
  </div>
  <style>
    @keyframes marker-pulse{0%{transform:scale(1);opacity:0.6}50%{transform:scale(1.8);opacity:0}100%{transform:scale(2.2);opacity:0}}
  </style>
`;

const LocationPickerModal = ({ onClose, onConfirm, initialAddress, initialLat, initialLng }: LocationPickerModalProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const labelsLayerRef = useRef<L.TileLayer | null>(null);
  const [address, setAddress] = useState(initialAddress || "");
  const [lat, setLat] = useState(initialLat || "-23.5505");
  const [lng, setLng] = useState(initialLng || "-46.6333");
  const [searching, setSearching] = useState(false);
  const [mapStyle, setMapStyle] = useState("satellite");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(17);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const initLat = parseFloat(lat) || -23.5505;
    const initLng = parseFloat(lng) || -46.6333;

    const map = L.map(mapRef.current, {
      center: [initLat, initLng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
      minZoom: 3,
      maxZoom: 19,
    });

    const tile = L.tileLayer(MAP_STYLES[0].url, { maxZoom: 19 }).addTo(map);
    tileLayerRef.current = tile;

    const labels = L.tileLayer(LABELS_URL, { maxZoom: 19 }).addTo(map);
    labelsLayerRef.current = labels;

    const customIcon = L.divIcon({
      html: MARKER_HTML,
      iconSize: [44, 56],
      iconAnchor: [22, 56],
      className: "",
    });

    const marker = L.marker([initLat, initLng], { draggable: true, icon: customIcon }).addTo(map);
    markerRef.current = marker;

    marker.on("dragend", async () => {
      const pos = marker.getLatLng();
      setLat(pos.lat.toFixed(6));
      setLng(pos.lng.toFixed(6));
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json`);
        const data = await res.json();
        if (data.display_name) setAddress(data.display_name);
      } catch {}
    });

    map.on("click", async (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      setLat(clickLat.toFixed(6));
      setLng(clickLng.toFixed(6));
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${clickLat}&lon=${clickLng}&format=json`);
        const data = await res.json();
        if (data.display_name) setAddress(data.display_name);
      } catch {}
    });

    map.on("zoomend", () => setCurrentZoom(map.getZoom()));

    mapInstance.current = map;
    return () => { map.remove(); mapInstance.current = null; };
  }, []);

  const switchMapStyle = (styleId: string) => {
    setMapStyle(styleId);
    setShowStylePicker(false);
    const style = MAP_STYLES.find(s => s.id === styleId);
    if (!style || !mapInstance.current) return;

    if (tileLayerRef.current) mapInstance.current.removeLayer(tileLayerRef.current);
    if (labelsLayerRef.current) mapInstance.current.removeLayer(labelsLayerRef.current);

    const newTile = L.tileLayer(style.url, { maxZoom: 19 }).addTo(mapInstance.current);
    tileLayerRef.current = newTile;

    // Add labels on satellite only
    if (styleId === "satellite") {
      const newLabels = L.tileLayer(LABELS_URL, { maxZoom: 19 }).addTo(mapInstance.current);
      labelsLayerRef.current = newLabels;
    } else {
      labelsLayerRef.current = null;
    }
  };

  const handleZoom = (delta: number) => {
    mapInstance.current?.zoomIn(delta);
  };

  const handleRecenter = () => {
    const curLat = parseFloat(lat) || -23.5505;
    const curLng = parseFloat(lng) || -46.6333;
    mapInstance.current?.setView([curLat, curLng], 17, { animate: true });
  };

  const handleSearch = async () => {
    if (!address.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
      const data = await res.json();
      if (data[0]) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setLat(newLat.toFixed(6));
        setLng(newLng.toFixed(6));
        setAddress(data[0].display_name);
        mapInstance.current?.setView([newLat, newLng], 17, { animate: true });
        markerRef.current?.setLatLng([newLat, newLng]);
      }
    } catch {}
    setSearching(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'hsl(230 20% 5% / 0.92)', backdropFilter: 'blur(16px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="glass-card-strong w-full max-w-2xl overflow-hidden rounded-2xl"
        style={{ border: '1px solid hsl(0 0% 100% / 0.08)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid hsl(0 0% 100% / 0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'hsl(245 60% 55% / 0.15)' }}>
              <MapPin className="w-4 h-4" style={{ color: 'hsl(245 60% 65%)' }} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Selecionar Localização</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Clique no mapa ou arraste o pin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors hover:bg-white/10" style={{ background: 'hsl(0 0% 100% / 0.05)' }}>
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 sm:p-4 flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="glass-input !pl-10"
              placeholder="Buscar endereço..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button onClick={handleSearch} disabled={searching}
            className="px-4 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'hsl(245 60% 55%)', color: 'white' }}>
            {searching ? "..." : "Buscar"}
          </button>
        </div>

        {/* Map Container */}
        <div className="relative mx-3 sm:mx-4 rounded-xl overflow-hidden" style={{ border: '1px solid hsl(0 0% 100% / 0.06)' }}>
          <div ref={mapRef} className="w-full h-[350px] sm:h-[400px]" style={{ background: 'hsl(230 18% 8%)' }} />

          {/* Map Controls Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-[1000]">
            {/* Style Picker Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowStylePicker(!showStylePicker)}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: 'hsl(230 15% 12% / 0.9)', backdropFilter: 'blur(8px)', border: '1px solid hsl(0 0% 100% / 0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                <Layers className="w-4 h-4 text-foreground" />
              </button>

              <AnimatePresence>
                {showStylePicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 10 }}
                    className="absolute top-0 right-11 flex gap-1.5 p-1.5 rounded-xl"
                    style={{ background: 'hsl(230 15% 12% / 0.95)', backdropFilter: 'blur(12px)', border: '1px solid hsl(0 0% 100% / 0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {MAP_STYLES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => switchMapStyle(s.id)}
                        className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all text-[10px] font-semibold whitespace-nowrap"
                        style={{
                          background: mapStyle === s.id ? 'hsl(245 60% 55% / 0.2)' : 'transparent',
                          color: mapStyle === s.id ? 'hsl(245 60% 70%)' : 'hsl(0 0% 60%)',
                          border: `1px solid ${mapStyle === s.id ? 'hsl(245 60% 55% / 0.3)' : 'transparent'}`,
                        }}>
                        {s.id === "satellite" && "🛰️"}
                        {s.id === "streets" && "🗺️"}
                        {s.id === "topo" && "⛰️"}
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Zoom Controls */}
            <button
              onClick={() => handleZoom(1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'hsl(230 15% 12% / 0.9)', backdropFilter: 'blur(8px)', border: '1px solid hsl(0 0% 100% / 0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              <Plus className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => handleZoom(-1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'hsl(230 15% 12% / 0.9)', backdropFilter: 'blur(8px)', border: '1px solid hsl(0 0% 100% / 0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              <Minus className="w-4 h-4 text-foreground" />
            </button>

            {/* Recenter */}
            <button
              onClick={handleRecenter}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
              style={{ background: 'hsl(230 15% 12% / 0.9)', backdropFilter: 'blur(8px)', border: '1px solid hsl(0 0% 100% / 0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
              <Crosshair className="w-4 h-4 text-foreground" />
            </button>
          </div>

          {/* Zoom indicator */}
          <div className="absolute bottom-3 left-3 z-[1000] px-2.5 py-1 rounded-lg text-[10px] font-semibold text-foreground/70"
            style={{ background: 'hsl(230 15% 12% / 0.8)', backdropFilter: 'blur(8px)' }}>
            Zoom: {currentZoom}x
          </div>
        </div>

        {/* Coordinates Bar */}
        <div className="mx-3 sm:mx-4 mt-2 flex gap-2">
          <div className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-mono text-muted-foreground flex items-center gap-1.5"
            style={{ background: 'hsl(0 0% 100% / 0.03)', border: '1px solid hsl(0 0% 100% / 0.05)' }}>
            <span style={{ color: 'hsl(245 60% 65%)' }}>LAT</span> {parseFloat(lat).toFixed(6)}
          </div>
          <div className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-mono text-muted-foreground flex items-center gap-1.5"
            style={{ background: 'hsl(0 0% 100% / 0.03)', border: '1px solid hsl(0 0% 100% / 0.05)' }}>
            <span style={{ color: 'hsl(245 60% 65%)' }}>LNG</span> {parseFloat(lng).toFixed(6)}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 flex items-center justify-between" style={{ borderTop: '1px solid hsl(0 0% 100% / 0.06)', marginTop: '12px' }}>
          <p className="text-[11px] text-muted-foreground truncate flex-1 mr-3">
            {address || "Clique no mapa ou busque um endereço"}
          </p>
          <button
            onClick={() => onConfirm(address, lat, lng)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{ background: 'hsl(245 60% 55%)', color: 'white', boxShadow: '0 4px 20px hsl(245 60% 55% / 0.3)' }}>
            <Check className="w-4 h-4" /> Confirmar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationPickerModal;
