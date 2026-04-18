import { Ionicons } from "@expo/vector-icons";

export const mapIcon = (
  icon: string,
): React.ComponentProps<typeof Ionicons>["name"] => {
  const iconMap: Record<string, any> = {
    Package: "cube",
    HardHat: "wallet",
    Users: "people",
    User: "person",
    Settings: "settings",
    Building: "business",
    Car: "car",
    DollarSign: "cash",
    CalendarCheck: "calendar",
    Hammer: "hammer",
    FileBarChart: "stats-chart",
  };

  return iconMap[icon] || "grid";
};
