import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  Image,
  TouchableOpacity,
  Text,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { icons } from "@/constants";
import { GoogleInputProps } from "@/types/type";
import { router } from "expo-router";

const googlePlacesApiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY || "";

// Places Autocomplete caps out at 5 predictions with no pagination, so the
// footer reveals the ones already fetched rather than requesting another page.
const INITIAL_VISIBLE = 3;

interface PlaceSuggestion {
  description: string;
  place_id: string;
}

const GoogleTextInput = ({
  icon,
  initialLocation,
  placeholder,
  containerStyle,
  textInputBackgroundColor,
  handlePress,
}: GoogleInputProps) => {
  const [query, setQuery] = useState(initialLocation ?? "");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showAll, setShowAll] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setShowAll(false);
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
        setShowAll(false);
      } else {
        setSuggestions([]);
        setShowAll(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setSuggestions([]);
      setShowAll(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchSuggestions(text), 300);
  };

  const handleClear = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery("");
    setSuggestions([]);
    setShowAll(false);
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
      setShowAll(false);
    } catch (err) {
      console.error(err);
    }
  };

  const visibleSuggestions = showAll
    ? suggestions
    : suggestions.slice(0, INITIAL_VISIBLE);
  const canLoadMore = !showAll && suggestions.length > INITIAL_VISIBLE;

  return (
    <View
      className={`relative ${containerStyle}`}
      style={{ zIndex: 50, elevation: 12 }}
    >
      {/* Input Field */}
      <View
        className="flex flex-row items-center rounded-full"
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
          placeholder={placeholder ?? initialLocation ?? "Where do you want to go?"}
          placeholderTextColor="#000000"
          className="flex-1 px-4 py-3"
          style={{ fontSize: 16, fontWeight: "600", color: "#000000" }}
        />

        {/* Clear (✕) button — only when there is text */}
        {query.length > 0 && (
          <TouchableOpacity
            onPress={handleClear}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            className="justify-center items-center"
          >
            <Ionicons name="close-circle" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 55,
            left: 0,
            right: 0,
            backgroundColor: "#171717",
            borderRadius: 12,
            borderWidth: 0.5,
            borderColor: "#2A2A2A",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: 24,
            zIndex: 9999,
            overflow: "hidden",
          }}
        >
          <ScrollView
            style={{ maxHeight: 220 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {visibleSuggestions.map((item, index) => (
              <TouchableOpacity
                key={item.place_id}
                onPress={() => handlePlaceSelect(item)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth:
                    index === visibleSuggestions.length - 1 ? 0 : 0.5,
                  borderBottomColor: "#2A2A2A",
                }}
              >
                <Text
                  style={{
                    flex: 1,
                    fontSize: 15,
                    color: "#FFFFFF",
                    fontWeight: "500",
                  }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color="#0286FF"
                  style={{ marginLeft: 10 }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Footer */}
          {canLoadMore && (
            <TouchableOpacity
              onPress={() => setShowAll(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 12,
                borderTopWidth: 0.5,
                borderTopColor: "#2A2A2A",
                backgroundColor: "#1F1F1F",
              }}
            >
              <Text
                style={{ fontSize: 14, fontWeight: "600", color: "#0286FF" }}
              >
                Load more
              </Text>
              <Ionicons
                name="chevron-down"
                size={16}
                color="#0286FF"
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

export default GoogleTextInput;
