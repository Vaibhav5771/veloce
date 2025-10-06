import React, { useState, useEffect, useRef } from "react";
import { View, TextInput, Image, TouchableOpacity, Text } from "react-native";
import * as Location from "expo-location";
import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { router } from "expo-router";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "";

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

const GoogleTextInput = ({
  icon,
  initialLocation,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState(initialLocation ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialLocation ?? "");
  }, [initialLocation]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Fetch suggestions from Google Places
  const fetchSuggestions = async (input: string) => {
    if (!input || input.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          input,
        )}&key=${googlePlacesApiKey}&language=en`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.predictions) {
        setSuggestions(data.predictions);
      } else {
        setSuggestions([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  // Handle selecting a suggestion
  const handlePlaceSelect = async (place: PlaceSuggestion) => {
    try {
      const detailsRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&key=${googlePlacesApiKey}&fields=geometry`,
      );
      const detailsData = await detailsRes.json();

      let latitude = 0;
      let longitude = 0;

      if (
        detailsData.status === "OK" &&
        detailsData.result?.geometry?.location
      ) {
        const loc = detailsData.result.geometry.location;
        latitude = loc.lat;
        longitude = loc.lng;
      } else {
        const geocode = await Location.geocodeAsync(place.description);
        if (geocode.length > 0) {
          latitude = geocode[0].latitude;
          longitude = geocode[0].longitude;
        }
      }

      const location = {
        latitude,
        longitude,
        address: place.description,
      };

      if (handlePress) {
        handlePress(location);
      } else {
        // Navigate to RideLayout with params
        router.push({
          pathname: "/(root)/find-ride",
          params: {
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: place.description,
          },
        });
      }

      setQuery(place.description);
      setSuggestions([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle current location
  const handleCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      const [address] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const formattedAddress = `${address.name ?? ""} ${address.street ?? ""} ${address.city ?? ""}`;

      const location = {
        latitude,
        longitude,
        address: formattedAddress,
      };

      if (handlePress) {
        handlePress(location);
      } else {
        // Navigate to RideLayout
        router.push({
          pathname: "/(root)/find-ride",
          params: {
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            address: formattedAddress,
          },
        });
      }

      setQuery(formattedAddress);
      setSuggestions([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <View className={`relative z-50 ${containerStyle}`}>
      {/* Input Field */}
      <View
        className="flex flex-row items-center rounded-xl"
        style={{
          backgroundColor: textInputBackgroundColor || "white",
          height: 50,
          shadowColor: "#d4d4d4",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          elevation: 5,
          paddingHorizontal: 15,
        }}
      >
        {/* Left Icon */}
        <Image
          source={icon || icons.search}
          className="w-6 h-6"
          resizeMode="contain"
        />

        {/* Text Input */}
        <TextInput
          value={query}
          onChangeText={handleChange}
          placeholder={initialLocation ?? "Where do you want to go?"}
          placeholderTextColor="gray"
          className="flex-1 px-4 py-3"
          style={{ fontSize: 16, fontWeight: "600" }}
        />

        {/* Current Location */}
        <TouchableOpacity
          onPress={handleCurrentLocation}
          className="justify-center items-center w-10 h-10"
        >
          <Image source={icons.map} className="w-6 h-6" resizeMode="contain" />
        </TouchableOpacity>
      </View>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 55,
            left: 0,
            right: 0,
            backgroundColor: textInputBackgroundColor || "white",
            borderRadius: 10,
            shadowColor: "#d4d4d4",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            maxHeight: 200,
            zIndex: 9999,
          }}
        >
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.place_id}
              onPress={() => handlePlaceSelect(item)}
              style={{
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#e5e7eb",
              }}
            >
              <Text style={{ fontSize: 16 }}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default GoogleTextInput;
