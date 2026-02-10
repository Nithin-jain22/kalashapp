import { useMemo, useRef, useState } from "react";
import { Platform, SafeAreaView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { WebView } from "react-native-webview";
import { useSafeAreaInsets, SafeAreaProvider } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import Constants from "expo-constants";

const getWebUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_WEB_URL;
  if (envUrl) return envUrl;
  const extraUrl = Constants?.expoConfig?.extra?.webUrl;
  return extraUrl || "https://your-app.onrender.com";
};

export default function App() {
  const webUrl = useMemo(getWebUrl, []);
  const [canGoBack, setCanGoBack] = useState(false);
  const webViewRef = useRef(null);

  const handleShouldStartLoad = (request) => {
    try {
      const requestUrl = new URL(request.url);
      const allowedOrigin = new URL(webUrl).origin;
      if (requestUrl.origin !== allowedOrigin) {
        Linking.openURL(request.url);
        return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(Boolean(navState?.canGoBack));
  };

  const handleAndroidBack = () => {
    if (Platform.OS === "android" && canGoBack && webViewRef.current) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  return (
    <SafeAreaProvider>
      <Screen webUrl={webUrl} webViewRef={webViewRef} onNavChange={handleNavigationStateChange} onShouldStartLoad={handleShouldStartLoad} onAndroidBack={handleAndroidBack} />
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

function Screen({ webUrl, webViewRef, onNavChange, onShouldStartLoad, onAndroidBack }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <WebView
        ref={webViewRef}
        source={{ uri: webUrl }}
        style={styles.webview}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        onNavigationStateChange={onNavChange}
        onShouldStartLoadWithRequest={onShouldStartLoad}
        onAndroidBackPress={onAndroidBack}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  webview: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
});
