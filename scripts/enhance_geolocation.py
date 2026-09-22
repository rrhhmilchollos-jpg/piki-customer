from pathlib import Path
p = Path('/home/ubuntu/mesago-delivery/client/src/components/AccountHub.tsx')
text = p.read_text()
text = text.replace('import { useEffect, useMemo, useState } from "react";', 'import { useEffect, useMemo, useRef, useState } from "react";')
text = text.replace('  const [history, setHistory] = useState<OrderRecord[]>([]);', '  const [history, setHistory] = useState<OrderRecord[]>([]);\n  const mapRef = useRef<google.maps.Map | null>(null);')
old = '''    navigator.geolocation.getCurrentPosition(
      ({ coords }) => toast.success("Ubicación detectada", { description: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` }),
      () => toast.error("No pudimos detectar tu ubicación", { description: "Puedes escribir la dirección manualmente." }),
      { enableHighAccuracy: true, timeout: 10000 },
    );'''
new = '''    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position = { lat: coords.latitude, lng: coords.longitude };
        mapRef.current?.panTo(position);
        mapRef.current?.setZoom(16);
        if (!window.google?.maps) {
          toast.success("Ubicación detectada", { description: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` });
          return;
        }
        new google.maps.Geocoder().geocode({ location: position }, (results, status) => {
          if (status === "OK" && results?.[0]) toast.success("Dirección autocompletada", { description: results[0].formatted_address });
          else toast.success("Ubicación detectada", { description: `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}` });
        });
      },
      () => toast.error("No pudimos detectar tu ubicación", { description: "Puedes escribir la dirección manualmente." }),
      { enableHighAccuracy: true, timeout: 10000 },
    );'''
text = text.replace(old, new)
text = text.replace('onMapReady={(map) => { restaurants.slice(0, 6).forEach', 'onMapReady={(map) => { mapRef.current = map; restaurants.slice(0, 6).forEach')
p.write_text(text)
