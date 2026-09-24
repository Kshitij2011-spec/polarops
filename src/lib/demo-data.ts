export type Status = "NOMINAL" | "WARNING" | "CRITICAL" | "WATCH" | "ATTENTION" | "INFO";

export const demoStationData = {
  active: "BHARATI",
  season: "WINTER",
  connectivity: "CONNECTED",
  sync: "SYNCHRONIZED",
  stations: [
    { name: "BHARATI", state: "WINTER OPERATIONS", connectivity: "CONNECTED", personnel: 52, power: "NOMINAL", alerts: 2 },
    { name: "MAITRI", state: "WINTER OPERATIONS", connectivity: "CONNECTED", personnel: 25, power: "NOMINAL", alerts: 0 },
  ],
};

export const demoMetrics = [
  { label: "POWER", value: "1,240 kW", detail: "Generation and distribution", status: "NOMINAL" as Status },
  { label: "FUEL", value: "68%", detail: "Diesel storage capacity", status: "WARNING" as Status },
  { label: "PERSONNEL", value: "52", detail: "Station complement", status: "NOMINAL" as Status },
  { label: "TEMPERATURE", value: "−21.4 °C", detail: "External environmental conditions", status: "NOMINAL" as Status },
];

export const demoG02 = {
  id: "G-02",
  name: "DIESEL GENERATOR G-02",
  status: "CRITICAL" as Status,
  telemetry: [
    ["Bearing vibration", "+3.1% deviation"],
    ["Power contribution", "42%"],
    ["Dependency", "Power Bus A"],
    ["Warning threshold", "+2.5%"],
  ],
  condition: [
    ["Power output", "520 kW"],
    ["Vibration", "+3.1%"],
    ["Temperature", "74°C"],
    ["Runtime", "4,821 h"],
    ["Fuel flow", "82 L/h"],
  ],
};

export const demoTimeline = [
  ["14:22:07", "Anomaly detected"],
  ["14:22:31", "Operating context evaluated"],
  ["14:23:04", "Power dependency identified"],
  ["14:23:28", "Impact scenario generated"],
  ["14:24:10", "Operational recommendation created"],
  ["14:24:42", "Human review required"],
];

export const demoDependencies = [
  ["G-02", "POWER BUS A", "HABITAT"],
  ["G-02", "POWER BUS A", "SCIENCE LAB"],
  ["G-02", "POWER SYSTEM", "FUEL SYSTEM"],
];

export const demoActivities: Array<[string, string, string]> = [
  ["14:22", "Generator G-02 anomaly detected", "WARNING"],
  ["13:58", "SATCOM communication window opened", "NOMINAL"],
  ["13:30", "Fuel transfer completed", "NOMINAL"],
  ["12:48", "Science telemetry synchronized", "NOMINAL"],
];

export const topologyNodes = [
  { id: "power", name: "POWER PLANT", detail: "3 generators", status: "CRITICAL" as Status, x: 12, y: 44 },
  { id: "comms", name: "COMMS MAST", detail: "SATCOM", status: "NOMINAL" as Status, x: 38, y: 12 },
  { id: "habitat", name: "HABITAT", detail: "52 occupants", status: "NOMINAL" as Status, x: 68, y: 24 },
  { id: "lab", name: "SCIENCE LAB", detail: "4 experiments", status: "NOMINAL" as Status, x: 72, y: 66 },
  { id: "fuel", name: "FUEL FARM", detail: "68% capacity", status: "WARNING" as Status, x: 12, y: 76 },
  { id: "logistics", name: "LOGISTICS BAY", detail: "Traverse T-12", status: "NOMINAL" as Status, x: 42, y: 78 },
  { id: "water", name: "WATER & WASTE", detail: "74% capacity", status: "NOMINAL" as Status, x: 40, y: 44 },
];

export const demoResources = [
  ["FUEL", 68, "WARNING", "1,320 L/day", "81 days"],
  ["POWER", 84, "NOMINAL", "1,240 kW", "N+1 generation"],
  ["WATER", 74, "NOMINAL", "4.2 m³/day", "31 days"],
  ["FOOD", 82, "NOMINAL", "126 kg/day", "104 days"],
  ["MEDICAL", 91, "NOMINAL", "Stable", "180 days"],
  ["LOGISTICS", 61, "WATCH", "2 movements", "Next: 18 days"],
];

export const demoScenarios: Array<[string, string, string, string]> = [
  ["GENERATOR FAILURE", "Loss of one primary diesel generator", "Power, Habitat, Science", "CRITICAL"],
  ["FUEL SHORTAGE", "Winter fuel falls below operational reserve", "Power, Heat, Logistics", "HIGH"],
  ["COMMUNICATION LOSS", "Primary SATCOM link unavailable", "Comms, Data sync", "MEDIUM"],
  ["SEVERE WEATHER", "Sustained whiteout and extreme winds", "Logistics, Personnel", "HIGH"],
  ["SUPPLY DELAY", "Seasonal resupply delayed by 21 days", "Fuel, Food, Medical", "MEDIUM"],
];

export const demoAlerts = [
  { id: 1, level: "CRITICAL", text: "G-02 generator vibration exceeds threshold", time: "14:22 UTC" },
  { id: 2, level: "WARNING", text: "Fuel reserve approaching winter planning threshold", time: "13:46 UTC" },
  { id: 3, level: "INFO", text: "SATCOM synchronization completed", time: "13:30 UTC" },
];

export const demoReports = [
  "DAILY STATION REPORT",
  "RESOURCE STATUS REPORT",
  "INCIDENT REPORT",
  "RESILIENCE REPORT",
  "SCENARIO ANALYSIS",
];

export const demoOfflineState = {
  lastSynchronized: "23 SEP 2026 · 14:22 UTC",
  localEvents: 3,
  pendingSync: 2,
  lastAcknowledged: "14:22 UTC",
  nextSync: "WHEN CONNECTIVITY AVAILABLE",
};

export const demoSyncQueue = [
  { id: 1, event: "G-02 inspection reviewed", state: "PENDING SYNC", priority: "CRITICAL" },
  { id: 2, event: "Resource status reviewed", state: "PENDING SYNC", priority: "ROUTINE" },
  { id: 3, event: "Scenario T-12 evaluated", state: "PENDING SYNC", priority: "ROUTINE" },
];

export const demoCapabilities = [
  ["DIGITAL TWIN", "Unified station topology and subsystem relationships."],
  ["PREDICTIVE REASONING", "Understand operational consequences before action."],
  ["RESOURCE INTELLIGENCE", "Monitor critical station resources."],
  ["SCENARIO SIMULATION", "Evaluate possible operational outcomes."],
  ["RESILIENCE", "Support operations under constrained connectivity."],
  ["HUMAN-IN-THE-LOOP", "Keep operators in control of operational decisions."],
] as const;
