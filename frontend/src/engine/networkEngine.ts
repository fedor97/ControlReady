// Pure, framework-free industrial network simulation.
// No AI, no AWS — this is the "physics" of the virtual LAN.

import type { DeviceState, DeviceId, DiscoveredDevice, PingResult } from "../types";

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export function isValidIpv4(ip: string): boolean {
  const m = IPV4_RE.exec(ip.trim());
  if (!m) return false;
  return m.slice(1, 5).every((octet) => {
    const n = Number(octet);
    return n >= 0 && n <= 255;
  });
}

export function ipToInt(ip: string): number {
  const m = IPV4_RE.exec(ip.trim());
  if (!m) return NaN;
  return m
    .slice(1, 5)
    .reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

/** True when two hosts are on the same broadcast domain, judged from `fromMask`'s point of view. */
export function sameSubnet(ipA: string, ipB: string, fromMask: string): boolean {
  if (!isValidIpv4(ipA) || !isValidIpv4(ipB) || !isValidIpv4(fromMask)) return false;
  const mask = ipToInt(fromMask);
  return (ipToInt(ipA) & mask) === (ipToInt(ipB) & mask);
}

export function findDevicesByIp(devices: DeviceState[], ip: string): DeviceState[] {
  return devices.filter((d) => d.network.ip === ip);
}

export function findDuplicateIps(devices: DeviceState[]): string[] {
  const counts = new Map<string, number>();
  for (const d of devices) counts.set(d.network.ip, (counts.get(d.network.ip) ?? 0) + 1);
  return [...counts.entries()].filter(([, count]) => count > 1).map(([ip]) => ip);
}

/**
 * Simulate `ping <targetIp>` issued from `fromId`.
 * Mirrors real diagnostic outcomes: unreachable subnet, cable down, device off, duplicate IP, timeout.
 */
export function ping(fromId: DeviceId, targetIp: string, devices: DeviceState[]): PingResult {
  const from = devices.find((d) => d.id === fromId);
  const base = { fromId, targetIp } as const;

  if (!from) {
    return { ...base, kind: "invalid_target", resolvedDeviceId: null, ok: false, message: "Unknown source device." };
  }
  if (!isValidIpv4(targetIp)) {
    return { ...base, kind: "invalid_target", resolvedDeviceId: null, ok: false, message: `ping: cannot resolve ${targetIp}: Name or service not known` };
  }
  if (!from.cableConnected) {
    return { ...base, kind: "cable_disconnected", resolvedDeviceId: null, ok: false, message: `${from.name}: network cable unplugged.` };
  }
  if (!from.poweredOn) {
    return { ...base, kind: "powered_off", resolvedDeviceId: null, ok: false, message: `${from.name} is powered off.` };
  }

  const matches = findDevicesByIp(devices, targetIp);

  if (matches.length > 1) {
    return {
      ...base,
      kind: "duplicate_ip",
      resolvedDeviceId: matches[0].id,
      ok: false,
      message: `Reply from ${targetIp}: Destination Host Unreachable (duplicate IP address detected on network — ${matches.map((m) => m.name).join(", ")}).`,
    };
  }

  const target = matches[0];
  if (!target) {
    return { ...base, kind: "timeout", resolvedDeviceId: null, ok: false, message: `Request timed out.` };
  }
  if (!target.poweredOn) {
    return { ...base, kind: "powered_off", resolvedDeviceId: target.id, ok: false, message: `Request timed out. (${target.name} is powered off.)` };
  }
  if (!target.cableConnected) {
    return { ...base, kind: "cable_disconnected", resolvedDeviceId: target.id, ok: false, message: `Request timed out. (${target.name} network cable unplugged.)` };
  }
  if (!sameSubnet(from.network.ip, target.network.ip, from.network.subnet)) {
    return {
      ...base,
      kind: "unreachable_subnet",
      resolvedDeviceId: target.id,
      ok: false,
      message: `Destination host unreachable. (${target.name} at ${target.network.ip} is not on the same subnet as ${from.name} at ${from.network.ip}/${from.network.subnet}.)`,
    };
  }

  return {
    ...base,
    kind: "success",
    resolvedDeviceId: target.id,
    ok: true,
    message: `Reply from ${targetIp}: bytes=32 time<1ms TTL=64\nCommunication OK.`,
  };
}

/** `discover` — list every device reachable from `fromId`. */
export function discover(fromId: DeviceId, devices: DeviceState[]): DiscoveredDevice[] {
  return devices
    .filter((d) => d.id !== fromId)
    .map((d) => {
      const result = ping(fromId, d.network.ip, devices);
      return { id: d.id, name: d.name, ip: d.network.ip, reachable: result.ok };
    });
}
