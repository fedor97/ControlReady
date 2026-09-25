// Lab 1 — Motor Control Room. This file is pure data: the generic LabRunner reads it.
// Adding Lab 2/3 later means writing a sibling file like this one, not new page architecture.

import type { FaultScenario, LabDefinition, VfdState } from "../../types";

const HEALTHY_VFD_NETWORK = { ip: "192.168.1.20", subnet: "255.255.255.0", gateway: "192.168.1.1" };

const initialVfd: VfdState = {
  params: { frequencyReference: 60, acceleration: 5, deceleration: 5, networkControlEnabled: true },
  runCommand: false,
  outputFrequency: 0,
  motorCurrent: 0,
  faultCode: null,
  commOk: false,
  ready: false,
  running: false,
};

const faultCatalog: FaultScenario[] = [
  {
    id: "wrong_vfd_ip",
    title: "Wrong VFD IP Address",
    summary: "The VFD is configured on a different subnet than the PLC expects.",
    implemented: true,
    apply: () => ({ deviceNetworkOverrides: { vfd: { ip: "192.168.2.20" } } }),
    rootCause: "Incorrect VFD network configuration — the VFD was set to 192.168.2.20, a different subnet than the PLC (192.168.1.10/24), so the PLC cannot communicate with the VFD.",
    correctiveAction: "Changed the VFD IP address to 192.168.1.20 (255.255.255.0) to match the PLC's subnet, restoring PLC-to-VFD communication.",
    hintLadder: [
      "Check communication with the devices involved in the motor circuit.",
      "Verify communication between the PLC and VFD.",
      "Try pinging the VFD.",
      "Compare the VFD network configuration with the PLC network.",
      "Check whether the VFD IP address is on the same subnet as the PLC.",
    ],
  },
  {
    id: "duplicate_ip",
    title: "Duplicate IP Address",
    summary: "The VFD shares an IP address with another device on the network.",
    implemented: true,
    apply: () => ({ deviceNetworkOverrides: { vfd: { ip: "192.168.1.50" } } }),
    rootCause: "The VFD was assigned 192.168.1.50, which duplicates the Engineering PC's address, causing an IP conflict.",
    correctiveAction: "Reassigned the VFD to its correct, unique address: 192.168.1.20/24.",
    hintLadder: [
      "Check communication with the devices involved in the motor circuit.",
      "Ping the VFD and read the response carefully.",
      "A 'duplicate IP' response means more than one device claims the same address.",
      "Use Discover Devices to see every address currently in use.",
      "Reassign the VFD to its correct, unique IP address.",
    ],
  },
  {
    id: "wrong_plc_ip",
    title: "Wrong PLC IP Address",
    summary: "The PLC itself is on the wrong subnet.",
    implemented: true,
    apply: () => ({ deviceNetworkOverrides: { plc: { ip: "192.168.5.10" } } }),
    rootCause: "The PLC was configured with 192.168.5.10, isolating it from every other device on 192.168.1.0/24, including the VFD.",
    correctiveAction: "Reconfigured the PLC to 192.168.1.10/255.255.255.0 to rejoin the control network.",
    hintLadder: [
      "Check communication starting from the Engineering PC — can it reach anything?",
      "Ping the PLC from the Engineering PC.",
      "If nothing on the network responds to the PLC, suspect the PLC's own configuration, not just the VFD's.",
      "Compare the PLC's IP/subnet against the rest of the 192.168.1.0/24 network.",
      "Correct the PLC's IP address to 192.168.1.10/255.255.255.0.",
    ],
  },
  {
    id: "disconnected_cable",
    title: "Disconnected Ethernet Cable",
    summary: "The VFD's Ethernet cable is unseated at the switch.",
    implemented: true,
    apply: () => ({ deviceCableOverrides: { vfd: false } }),
    rootCause: "The VFD's Ethernet cable was disconnected from the switch, physically breaking the network path to the PLC.",
    correctiveAction: "Reseated the Ethernet cable between the VFD and the switch and verified link status.",
    hintLadder: [
      "Check communication with the devices involved in the motor circuit.",
      "Ping the VFD — is it a timeout or something else?",
      "A hard timeout with correct IP settings often points to a physical layer problem.",
      "Inspect the Ethernet cable connections at the switch and at the VFD.",
      "Reconnect the VFD's network cable.",
    ],
  },
  {
    id: "overload_tripped",
    title: "Motor Overload Tripped",
    summary: "The overload relay has tripped, opening the safety interlock.",
    implemented: true,
    apply: () => ({ tagOverrides: { Overload_OK: false } }),
    rootCause: "The overload relay tripped (Overload_OK = FALSE), opening the motor start permissive in the ladder logic.",
    correctiveAction: "Investigated the cause of the overload trip, cleared the fault, and reset the overload relay, restoring Overload_OK to TRUE.",
    hintLadder: [
      "Networking looks healthy here — shift your attention to the PLC tags.",
      "Open the PLC monitor and check the interlocks feeding Motor_Command, not just Start_PB.",
      "Look specifically at Overload_OK.",
      "A FALSE Overload_OK means the overload relay has tripped and is blocking the start permissive.",
      "Reset the overload relay to restore Overload_OK to TRUE.",
    ],
  },
  {
    id: "stop_circuit_open",
    title: "Stop Circuit Open",
    summary: "The normally-closed Stop circuit is open, blocking any start.",
    implemented: true,
    apply: () => ({ tagOverrides: { Stop_PB: false } }),
    rootCause: "The Stop_PB circuit reads FALSE, indicating the normally-closed stop circuit is open (e.g. an E-stop or field wiring fault), which blocks the seal-in rung unconditionally.",
    correctiveAction: "Located and cleared the open in the Stop circuit (reset the E-stop / repaired the wiring), restoring Stop_PB to TRUE.",
    hintLadder: [
      "Networking and the overload interlock both look fine — check the Stop circuit.",
      "Open the PLC monitor and watch Stop_PB while you press Start.",
      "Remember: Stop_PB is wired normally closed — TRUE means healthy, FALSE means the stop circuit is open.",
      "An open Stop circuit blocks the seal-in rung no matter what Start_PB does.",
      "Find and clear the open in the Stop circuit (check for a tripped E-stop).",
    ],
  },
  {
    id: "vfd_comm_fault",
    title: "VFD Internal Fault (Overcurrent/Undervoltage)",
    summary: "The VFD reports an internal drive fault unrelated to networking.",
    implemented: false,
    apply: () => ({}),
    rootCause: "Coming soon.",
    correctiveAction: "Coming soon.",
    hintLadder: ["This fault scenario is coming soon."],
  },
  {
    id: "sensor_failure",
    title: "Sensor 1 Failure",
    summary: "The proximity/photoeye sensor is stuck or wired incorrectly.",
    implemented: false,
    apply: () => ({}),
    rootCause: "Coming soon.",
    correctiveAction: "Coming soon.",
    hintLadder: ["This fault scenario is coming soon."],
  },
];

export const lab1Definition: LabDefinition = {
  id: "lab1-motor-control",
  name: "Motor Control Room",
  summary: "Diagnose and repair a real motor-start fault using network diagnostics, PLC tag monitoring, and VFD configuration.",
  workOrder: {
    id: "WO-1001",
    equipment: "Motor 1",
    problem: "Motor 1 will not start.",
    description: "Production reports that Motor 1 cannot be started.",
    task: "Diagnose the system, identify the root cause, repair the fault, verify normal operation, and document the work performed.",
  },
  devices: [
    { id: "plc", name: "PLC", kind: "plc", network: { ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
    { id: "vfd", name: "VFD", kind: "vfd", network: { ...HEALTHY_VFD_NETWORK }, poweredOn: true, cableConnected: true },
    { id: "pc", name: "Engineering PC", kind: "pc", network: { ip: "192.168.1.50", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
    { id: "server", name: "Automation Server", kind: "server", network: { ip: "192.168.1.100", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
    { id: "switch", name: "Ethernet Switch", kind: "switch", network: { ip: "192.168.1.2", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
  ],
  initialTags: {
    Start_PB: false,
    Stop_PB: true,
    Overload_OK: true,
    Motor_Command: false,
    Run_Command_To_VFD: false,
    VFD_Communication_OK: false,
    VFD_Fault: false,
    Motor_Running: false,
    Motor_Overload: false,
    Sensor_1: false,
  },
  ladder: {
    rungs: [
      {
        id: "rung1",
        label: "Rung 1 — Motor 1 Start/Stop (Seal-In)",
        comment: "Start_PB is momentary. Stop_PB and Overload_OK are normally-closed field devices — TRUE means healthy.",
        branches: [
          [
            { kind: "contact", tag: "Start_PB", contactType: "NO", label: "Start_PB" },
            { kind: "contact", tag: "Stop_PB", contactType: "NO", label: "Stop_PB" },
            { kind: "contact", tag: "Overload_OK", contactType: "NO", label: "Overload_OK" },
          ],
          [
            { kind: "contact", tag: "Motor_Command", contactType: "NO", label: "Motor_Command (seal-in)" },
            { kind: "contact", tag: "Stop_PB", contactType: "NO", label: "Stop_PB" },
            { kind: "contact", tag: "Overload_OK", contactType: "NO", label: "Overload_OK" },
          ],
        ],
        coil: { kind: "coil", tag: "Motor_Command", label: "Motor_Command" },
      },
      {
        id: "rung2",
        label: "Rung 2 — VFD Run Command Handoff",
        comment: "The PLC only sends Run to the VFD over the network when communication is healthy.",
        branches: [
          [
            { kind: "contact", tag: "Motor_Command", contactType: "NO", label: "Motor_Command" },
            { kind: "contact", tag: "VFD_Communication_OK", contactType: "NO", label: "VFD_Communication_OK" },
          ],
        ],
        coil: { kind: "coil", tag: "Run_Command_To_VFD", label: "Run_Command_To_VFD" },
      },
    ],
  },
  initialVfd,
  faultCatalog,
  defaultFaultId: "wrong_vfd_ip",
  gradingWeights: {
    networking: 25,
    plc: 20,
    faultDiagnosis: 25,
    verification: 15,
    documentation: 15,
  },
  skillOnCompletion: "Industrial Network Troubleshooting",
};
