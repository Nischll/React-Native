import { Ionicons } from "@expo/vector-icons";

export const mapIcon = (
  icon: string,
): React.ComponentProps<typeof Ionicons>["name"] => {
  const iconMap: Record<string, any> = {
    Package: "cube",
    HardHat: "construct",
    Users: "people",
    User: "person",
    Settings: "settings",
    Building: "business",
    Car: "car",
    DollarSign: "cash",
    CalendarCheck: "calendar",
    Calendar: "calendar",
    Hammer: "hammer",
    FileBarChart: "stats-chart",
    ClipboardList: "clipboard",
    ClipboardCheck: "checkbox",
    FileText: "document-text",
    BookOpen: "book",
    Wrench: "build",
    Shield: "shield",
    Key: "key",
    ParkingCircle: "car-sport",
    Zap: "flash",
    Layers: "layers",
    Home: "home",
    LayoutDashboard: "grid",
    ListTodo: "list",
    GraduationCap: "school",
    FolderOpen: "folder-open",
    Receipt: "receipt",
    ShoppingCart: "cart",
  };

  return iconMap[icon] || "grid";
};
