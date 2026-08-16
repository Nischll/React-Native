import { fetchOcpImageDisplayUri } from "@/src/helper/ocpMedia";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";

export default function OcpRemoteImage({
  fileUrl,
  className,
  style,
  resizeMode = "cover",
}: {
  fileUrl?: string | null;
  className?: string;
  style?: StyleProp<ImageStyle | ViewStyle>;
  resizeMode?: "cover" | "contain";
}) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setUri(null);
    (async () => {
      try {
        const next = await fetchOcpImageDisplayUri(fileUrl);
        if (!cancelled) setUri(next || null);
      } catch {
        if (!cancelled) setUri(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fileUrl]);

  if (loading) {
    return (
      <View
        className={`items-center justify-center bg-slate-100 ${className ?? ""}`}
        style={style as StyleProp<ViewStyle>}
      >
        <ActivityIndicator size="small" color="#64748B" />
      </View>
    );
  }

  if (!uri) {
    return (
      <View
        className={`bg-slate-100 ${className ?? ""}`}
        style={style as StyleProp<ViewStyle>}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      className={className}
      style={style as StyleProp<ImageStyle>}
      resizeMode={resizeMode}
    />
  );
}
