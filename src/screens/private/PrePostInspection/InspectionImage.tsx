import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ImageStyle,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { fetchInspectionImageDataUri } from "./imageHelpers";

type Props = {
  /** Server image id — fetched with auth */
  imageId?: number | null;
  /** Local file:// or data: URI (skips network) */
  localUri?: string | null;
  /** Applied to the outer container (width/height/radius live here) */
  style?: StyleProp<ViewStyle>;
  resizeMode?: "cover" | "contain" | "stretch" | "center";
};

/**
 * Displays PPI photos. Remote files require authenticated download;
 * local/new picks use `localUri` directly.
 */
export default function InspectionImage({
  imageId,
  localUri,
  style,
  resizeMode = "cover",
}: Props) {
  const [uri, setUri] = useState<string | null>(
    localUri?.startsWith("file:") || localUri?.startsWith("data:")
      ? localUri
      : null,
  );
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (localUri?.startsWith("file:") || localUri?.startsWith("data:")) {
      setUri(localUri);
      setFailed(false);
      setLoading(false);
      return;
    }

    if (imageId == null || Number.isNaN(Number(imageId))) {
      setUri(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    fetchInspectionImageDataUri(Number(imageId))
      .then((dataUri) => {
        if (!cancelled) {
          setUri(dataUri);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUri(null);
          setFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [imageId, localUri]);

  return (
    <View
      style={[
        {
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f1f5f9",
          overflow: "hidden",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#453956" />
      ) : uri && !failed ? (
        <Image
          source={{ uri }}
          style={{ width: "100%", height: "100%" } as ImageStyle}
          resizeMode={resizeMode}
        />
      ) : (
        <View
          style={{ width: "100%", height: "100%", backgroundColor: "#e2e8f0" }}
        />
      )}
    </View>
  );
}
