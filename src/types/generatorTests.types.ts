export interface GeneratorTestImageResponse {
  id: number;
  fileUrl?: string;
  originalFileName?: string;
  fileName?: string;
}

export interface GeneratorTestResponse {
  id: number;
  buildingId?: number;
  buildingName?: string;
  testDate: string;
  visualInspection?: boolean | null;
  fuelLevel?: string | null;
  oilLevelChecked?: boolean | null;
  coolantLevelChecked?: boolean | null;
  batteryFluidLevel?: string | null;
  batteryChargerOperation?: boolean | null;
  coolantLeakCheck?: boolean | null;
  fuelLeakCheck?: boolean | null;
  oilLeakCheck?: boolean | null;
  coolantBlockHeater?: boolean | null;
  hourMeterReading?: string | null;
  oilPressure?: string | null;
  coolantTemperature?: string | null;
  voltage?: string | null;
  amps?: string | null;
  frequency?: string | null;
  damperOperation?: string | null;
  miscellaneous?: string | null;
  transferSwitchTest?: boolean | null;
  hourMeterReadingAfterTest?: string | null;
  duration?: string | null;
  comment?: string | null;
  testedByUserId?: number | null;
  testedByDisplayName?: string | null;
  createdByUserName?: string | null;
  createdDate?: string | null;
  images?: GeneratorTestImageResponse[];
}

export interface GeneratorTestRequestPojo {
  buildingId?: number;
  testDate: string;
  testedByUserId?: number;
  visualInspection?: boolean;
  fuelLevel?: string;
  oilLevelChecked?: boolean;
  coolantLevelChecked?: boolean;
  batteryFluidLevel?: string;
  batteryChargerOperation?: boolean;
  coolantLeakCheck?: boolean;
  fuelLeakCheck?: boolean;
  oilLeakCheck?: boolean;
  coolantBlockHeater?: boolean;
  hourMeterReading?: string;
  oilPressure?: string;
  coolantTemperature?: string;
  voltage?: string;
  amps?: string;
  frequency?: string;
  damperOperation?: string;
  miscellaneous?: string;
  transferSwitchTest?: boolean;
  hourMeterReadingAfterTest?: string;
  duration?: string;
  comment?: string;
}

export const GENERATOR_CHECK_FIELDS: {
  key: keyof GeneratorTestRequestPojo;
  label: string;
}[] = [
  { key: "visualInspection", label: "Visual Inspection" },
  { key: "oilLevelChecked", label: "Oil Level Checked" },
  { key: "coolantLevelChecked", label: "Coolant Level Checked" },
  { key: "batteryChargerOperation", label: "Battery Charger Operation" },
  { key: "coolantLeakCheck", label: "Coolant Leak Check" },
  { key: "fuelLeakCheck", label: "Fuel Leak Check" },
  { key: "oilLeakCheck", label: "Oil Leak Check" },
  { key: "coolantBlockHeater", label: "Coolant Block Heater" },
  { key: "transferSwitchTest", label: "Transfer Switch Test" },
];
