import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { useColorScheme } from "react-native";
import Colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: theme.card },
        headerTintColor: Colors.primary,
        headerTitleStyle: { color: theme.text, fontFamily: "Inter_600SemiBold" },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="direct-chat"
        options={{ title: "Direct Chat", headerShown: true }}
      />
      <Stack.Screen
        name="text-repeater"
        options={{ title: "Text Repeater", headerShown: true }}
      />
      <Stack.Screen
        name="bulk-message"
        options={{ title: "Bulk Message", headerShown: true }}
      />
      <Stack.Screen
        name="fancy-text"
        options={{ title: "Fancy Text", headerShown: true }}
      />
      <Stack.Screen
        name="ai-caption"
        options={{ title: "AI Caption", headerShown: true }}
      />
      <Stack.Screen
        name="status-scheduler"
        options={{ title: "Status Scheduler", headerShown: true }}
      />
      <Stack.Screen
        name="saved-status"
        options={{ title: "Saved Status", headerShown: true }}
      />
      <Stack.Screen
        name="chat-backup"
        options={{ title: "Chat Backup Viewer", headerShown: true }}
      />
      <Stack.Screen
        name="status-analytics"
        options={{ title: "Status Analytics", headerShown: true }}
      />
      <Stack.Screen
        name="ai-sticker"
        options={{ title: "AI Sticker Generator", headerShown: true }}
      />
      <Stack.Screen
        name="chat-organizer"
        options={{ title: "Chat Organizer", headerShown: true }}
      />
      <Stack.Screen
        name="media-cleaner"
        options={{ title: "Media Cleaner", headerShown: true }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
