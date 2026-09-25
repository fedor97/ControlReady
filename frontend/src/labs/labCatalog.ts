export interface LabCatalogEntry {
  number: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  minutes: number;
  skills: string[];
  /** Route param for the one implemented lab; undefined = not yet built. */
  routeId?: string;
  status: "available" | "coming_soon";
}

export const LAB_CATALOG: LabCatalogEntry[] = [
  { number: "01", title: "Motor Start/Stop", difficulty: "Beginner", minutes: 45, skills: ["PLC", "Motor Controls", "Networking"], routeId: "lab1-motor-control", status: "available" },
  { number: "02", title: "Forward / Reverse Motor", difficulty: "Beginner", minutes: 40, skills: ["PLC", "Motor Controls"], status: "coming_soon" },
  { number: "03", title: "Conveyor Control", difficulty: "Beginner", minutes: 50, skills: ["PLC", "Sensors", "Sequencing"], status: "coming_soon" },
  { number: "04", title: "VFD Speed Control", difficulty: "Intermediate", minutes: 45, skills: ["VFD", "Parameters"], status: "coming_soon" },
  { number: "05", title: "Tank Level Control", difficulty: "Intermediate", minutes: 50, skills: ["PLC", "Analog I/O"], status: "coming_soon" },
  { number: "06", title: "PLC I/O", difficulty: "Beginner", minutes: 35, skills: ["PLC", "Wiring"], status: "coming_soon" },
  { number: "07", title: "Alarm & Fault Monitoring", difficulty: "Intermediate", minutes: 45, skills: ["SCADA", "Troubleshooting"], status: "coming_soon" },
  { number: "08", title: "Industrial Networking", difficulty: "Intermediate", minutes: 50, skills: ["Networking", "EtherNet/IP"], status: "coming_soon" },
  { number: "09", title: "SCADA / HMI", difficulty: "Intermediate", minutes: 50, skills: ["SCADA", "HMI Design"], status: "coming_soon" },
  { number: "10", title: "Full Troubleshooting Challenge", difficulty: "Advanced", minutes: 75, skills: ["PLC", "VFD", "Networking", "SCADA"], status: "coming_soon" },
];
