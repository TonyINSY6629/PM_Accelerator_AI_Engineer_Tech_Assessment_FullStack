import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";

const markerIcon = new Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type WeatherMapInnerProps = {
  latitude: number;
  longitude: number;
  locationName: string;
};

export default function WeatherMapInner({ latitude, longitude, locationName }: WeatherMapInnerProps) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={11}
      scrollWheelZoom={false}
      className="h-[40rem] w-full rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles"
      />
      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup>{locationName}</Popup>
      </Marker>
    </MapContainer>
  );
}
