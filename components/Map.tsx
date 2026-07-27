import { View, Image } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { useDriverStore, useLocationStore } from "@/store";
import { generateMarkersFromData } from "@/lib/map";
import { useEffect, useRef, useState } from "react";
import type { SharedValue } from "react-native-reanimated";
import { MarkerData } from "@/types/type";
import { icons } from "@/constants"; // ✅ make sure you have this
import GpsButton from "@/components/GpsButton";

const ROUTE_EDGE_PADDING = { top: 80, right: 80, bottom: 300, left: 80 };

// Mocked driver movement: no live GPS, so we animate the selected driver's
// marker along the fetched route polyline instead. Same real-seconds-per-
// simulated-minute scale as the "Arriving in X min" countdown on track-ride.
const MOCK_MS_PER_SIMULATED_MINUTE = 8000;
const DRIVER_ANIMATION_STEP_MS = 200;

// Google "Aubergine" (night blue) map theme
const AUBERGINE_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
  {
    featureType: "administrative.country",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#64779e" }],
  },
  {
    featureType: "administrative.province",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4b6878" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.stroke",
    stylers: [{ color: "#334e87" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#283d6a" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6f9ba5" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ color: "#023e58" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#304a7d" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#1d2c4d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2c6675" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#255763" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0d5ce" }],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [{ color: "#98a5be" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0e1626" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4e6d70" }],
  },
];

const drivers = [
  {
    id: "1",
    first_name: "James",
    last_name: "Wilson",
    profile_image_url:
      "https://ucarecdn.com/dae59f69-2c1f-48c3-a883-017bcf0f9950/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a2dc52b2-8bf7-4e49-9a36-3ffb5229ed02/-/preview/465x466/",
    car_seats: 4,
    rating: "4.80",
  },
  {
    id: "2",
    first_name: "David",
    last_name: "Brown",
    profile_image_url:
      "https://ucarecdn.com/6ea6d83d-ef1a-483f-9106-837a3a5b3f67/-/preview/1000x666/",
    car_image_url:
      "https://ucarecdn.com/a3872f80-c094-409c-82f8-c9ff38429327/-/preview/930x932/",
    car_seats: 5,
    rating: "4.60",
  },
  {
    id: "3",
    first_name: "Michael",
    last_name: "Johnson",
    profile_image_url:
      "https://ucarecdn.com/0330d85c-232e-4c30-bd04-e5e4d0e3d688/-/preview/826x822/",
    car_image_url:
      "https://ucarecdn.com/289764fb-55b6-4427-b1d1-f655987b4a14/-/preview/930x932/",
    car_seats: 4,
    rating: "4.70",
  },
  {
    id: "4",
    first_name: "Robert",
    last_name: "Green",
    profile_image_url:
      "https://ucarecdn.com/fdfc54df-9d24-40f7-b7d3-6f391561c0db/-/preview/626x417/",
    car_image_url:
      "https://ucarecdn.com/b6fb3b55-7676-4ff3-8484-fb115e268d32/-/preview/930x932/",
    car_seats: 4,
    rating: "4.90",
  },
];

const Map = ({
  gpsButtonBottom = 16,
  onlyShowSelectedDriver = false,
}: {
  gpsButtonBottom?: number | string | SharedValue<number>;
  onlyShowSelectedDriver?: boolean;
}) => {
  const {
    userLongitude,
    userLatitude,
    destinationLatitude,
    destinationLongitude,
  } = useLocationStore();

  const { selectedDriver, setDrivers } = useDriverStore();

  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [driverProgressIndex, setDriverProgressIndex] = useState(0);
  const mapRef = useRef<MapView>(null);

  const selectedMarker = markers.find(
    (marker) => Number(marker.id) === selectedDriver,
  );

  const visibleMarkers =
    onlyShowSelectedDriver && selectedMarker ? [selectedMarker] : markers;

  const hasSelectedRoute =
    !!selectedMarker && !!destinationLatitude && !!destinationLongitude;

  // Animate the driver marker along the route (pickup leg, then destination
  // leg) instead of leaving it parked at its initial mock position.
  useEffect(() => {
    if (!hasSelectedRoute || routeCoordinates.length < 2) return;

    const totalDurationMs =
      (selectedMarker?.time ?? 8) * 2 * MOCK_MS_PER_SIMULATED_MINUTE;
    const totalSteps = Math.max(
      1,
      Math.round(totalDurationMs / DRIVER_ANIMATION_STEP_MS),
    );

    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      const fraction = Math.min(1, step / totalSteps);
      setDriverProgressIndex(
        Math.floor(fraction * (routeCoordinates.length - 1)),
      );
      if (fraction >= 1) clearInterval(interval);
    }, DRIVER_ANIMATION_STEP_MS);

    return () => clearInterval(interval);
  }, [routeCoordinates, hasSelectedRoute, selectedMarker?.time]);

  const recenter = () => {
    if (userLatitude && userLongitude) {
      mapRef.current?.animateToRegion(
        {
          latitude: userLatitude,
          longitude: userLongitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        800,
      );
    }
  };

  useEffect(() => {
    // Enrich mock drivers with title/time/price until the Directions API is wired
    const enrichedDrivers = drivers.map((driver, index) => ({
      ...driver,
      title: `${driver.first_name} ${driver.last_name}`,
      time: 5 + index * 4,
      price: (12 + index * 3).toFixed(2),
    }));
    // @ts-ignore
    setDrivers(enrichedDrivers);

    if (Array.isArray(drivers)) {
      if (!userLatitude || !userLongitude) return;

      // @ts-ignore
      const newMarkers = generateMarkersFromData({
        data: drivers,
        userLatitude,
        userLongitude,
      });

      // @ts-ignore
      setMarkers(newMarkers);
    }
  }, [drivers, userLatitude, userLongitude]);

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1, borderRadius: 16 }}
        mapType="standard"
        customMapStyle={AUBERGINE_MAP_STYLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: userLatitude ?? 18.5204, // Pune latitude
          longitude: userLongitude ?? 73.8567, // Pune longitude
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {visibleMarkers.map((marker) => {
          const isSelected = Number(marker.id) === selectedDriver;
          const isAnimating =
            isSelected && hasSelectedRoute && routeCoordinates.length > 0;
          const coordinate = isAnimating
            ? routeCoordinates[driverProgressIndex]
            : { latitude: marker.latitude, longitude: marker.longitude };

          return (
            <Marker
              key={marker.id}
              coordinate={coordinate}
              title={marker.title}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="items-center justify-center">
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSelected
                      ? "rgba(2,134,255,0.55)"
                      : "rgba(2,134,255,0.3)",
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: "#0286FF",
                  }}
                >
                  <Image
                    source={isSelected ? icons.selectedMarker : icons.marker}
                    style={{ width: 32, height: 32 }}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </Marker>
          );
        })}

        {hasSelectedRoute && (
          <>
            <Marker
              coordinate={{
                latitude: destinationLatitude!,
                longitude: destinationLongitude!,
              }}
              title="Destination"
              anchor={{ x: 0.5, y: 1 }}
            >
              <Image
                source={icons.pin}
                style={{ width: 34, height: 34 }}
                resizeMode="contain"
              />
            </Marker>

            {/* Fetches the route only - its own line is hidden (transparent)
                so the Polyline below, trimmed to what's still ahead of the
                driver, is the only visible route as the marker advances. */}
            <MapViewDirections
              origin={{
                latitude: selectedMarker!.latitude,
                longitude: selectedMarker!.longitude,
              }}
              waypoints={
                userLatitude && userLongitude
                  ? [{ latitude: userLatitude, longitude: userLongitude }]
                  : undefined
              }
              destination={{
                latitude: destinationLatitude!,
                longitude: destinationLongitude!,
              }}
              apikey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY!}
              strokeWidth={4}
              strokeColor="transparent"
              onReady={(result) => {
                setRouteCoordinates(result.coordinates);
                setDriverProgressIndex(0);
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: ROUTE_EDGE_PADDING,
                  animated: true,
                });
              }}
              onError={(errorMessage) => {
                console.error("MapViewDirections error:", errorMessage);
                mapRef.current?.fitToCoordinates(
                  [
                    {
                      latitude: selectedMarker!.latitude,
                      longitude: selectedMarker!.longitude,
                    },
                    {
                      latitude: destinationLatitude!,
                      longitude: destinationLongitude!,
                    },
                  ],
                  { edgePadding: ROUTE_EDGE_PADDING, animated: true },
                );
              }}
            />

            {routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates.slice(driverProgressIndex)}
                strokeWidth={4}
                strokeColor="#00FF1A"
                lineCap="round"
                lineJoin="round"
              />
            )}
          </>
        )}
      </MapView>

      <GpsButton onPress={recenter} bottom={gpsButtonBottom} />
    </View>
  );
};

export default Map;
