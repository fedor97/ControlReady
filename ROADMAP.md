# Roadmap

## Shipped in MVP
- Lab Library: 10-lab catalog grid (difficulty/time/skills/best-score per card); Lab 1 is enterable, Labs 2–10 show "Coming Soon"
- Lab 1: Motor Control Room — full loop: work order → 3D lab → network fault → PLC/VFD → repair → verify → service report → score → skill badge
- Fault scenario fully simulated: incorrect VFD IP/subnet (`wrong_vfd_ip`)
- Immersive lab UI: 3D room dominant, mission stepper (Inspect→Diagnose→Repair→Test→Report, auto-derived from live state), collapsible Work Order card, camera fly-to presets, a contextual per-device inspector, and four on-demand tool windows (Network Tools, PLC Software, SCADA, Report) launched from a slim bottom toolbar or the Engineering PC workstation
- A decorative conveyor + enclosed room (walls/ceiling/cable trays) visually driven by the same Motor_Running signal — see "Lab 2" below for turning this into its own simulated lab
- Local network/PLC/VFD/scoring/hint engines — zero AI, zero paid APIs, zero AWS dependency to run
- Rule-based progressive hint system (5-step ladder, tracked and scored)
- Instructor Mode: pick a fault scenario before the student starts (6 of 8 catalog scenarios implemented; rest shown as "Coming Soon")
- Demo Mode (fully offline, localStorage progress, "Continue as Demo Student")
- Progress + Skills + Portfolio pages
- AWS architecture designed (SAM template, Python Lambda handlers, DynamoDB schema) — deployable, not required to run
- Unit tests for subnet/ping logic, motor permissive logic, fault detection, scoring

## Near-term
- **Optional premium AI Tutor**: add `aiHintProvider.ts` implementing the existing `HintProvider` interface, backed by a new `/ai/hint` Lambda calling Amazon Bedrock. Gate behind a plan flag; the rule-based engine remains the free-tier default. This is additive — no rework of `hintEngine.ts` callers.
- **Remaining Lab 1 fault scenarios** (catalog entries already defined, not yet simulated): duplicate IP, wrong PLC IP, disconnected Ethernet cable, VFD comm/overcurrent/undervoltage fault, overload tripped, stop-circuit open, sensor failure.
- **Lab 2 — Conveyor System**: photoeyes, jam detection, TON timers, counters, VFD, PLC sequencing. Reuses `LabDefinition`, `plcEngine`, `vfdEngine`, `scoringEngine`, `hintEngine` unchanged; has a visual head start (Lab 1's `Conveyor` component already models frame/rollers/belt/product motion) but needs its own PLC program, sensors, and fault catalog — Lab 1's conveyor is decorative, tied only to `Motor_Running`.
- **3D asset upgrade**: replace primitive-built equipment with authored GLTF/GLB models (needs an asset pipeline and sourcing/licensing decision) for Factory I/O-level visual fidelity; current models are procedural geometry chosen to avoid that dependency in the MVP.
- **Lab Library polish**: live/animated 3D thumbnails instead of static SVG preview art (deferred to avoid many concurrent WebGL contexts — see the StrictMode/context-loss note in ARCHITECTURE.md §3).
- **Lab 3 — BMS Mechanical Room**: AHU/VAV/chiller/boiler/pumps/dampers, BACnet/IP-flavored addressing (device instance numbers), schedules, alarms, trends. Needs a `bacnetEngine.ts` sibling to `networkEngine.ts`.
- CDK app replacing the hand-written SAM template for repeatable multi-env deploys.
- Cognito-backed multi-user accounts, instructor rosters/class view.
- Exportable PDF/HTML portfolio for job applications.

## Protocol depth (currently simplified)
- EtherNet/IP: modeled today as "PLC/VFD share an IP/subnet, comms up or down." Future: explicit I/O messaging, RPI.
- BACnet/IP: planned for Lab 3 — object/instance discovery, COV subscriptions.
- Modbus TCP: planned for a future "legacy retrofit" work order.
- OPC UA / MQTT: planned for a future "IIoT/dashboarding" work order.

## Real hardware
Out of scope for MVP by design. `networkEngine`/`plcEngine` already isolate all device I/O behind pure functions; a future `hardwareGateway.ts` would implement the same interface against a secure on-prem gateway (Micro800/CompactLogix/Siemens/BMS controller) instead of the in-browser simulation. Requires a dedicated security review before implementation (network isolation, read-only by default, no direct internet-to-PLC exposure).

## UX polish backlog
- Auto camera fly-to when a device is clicked (MVP: manual preset buttons + orbit controls; device clicks open the inspector but don't move the camera)
- Give the Network Tools / SCADA / Report tool windows a layout tuned for their larger on-demand size — they were designed as narrow cards and now have more whitespace than ideal in the full-size window
- Sound design (relay clack, VFD hum, alarm chime)
- Mobile/tablet layout pass (MVP targets 1366×768+ desktop/laptop)
- Exportable session replay for instructors
