import { describe, expect, it } from "vitest";
import { discover, isValidIpv4, ping, sameSubnet } from "./networkEngine";
import type { DeviceState } from "../types";

function makeDevices(overrides: Partial<Record<string, Partial<DeviceState>>> = {}): DeviceState[] {
  const base: DeviceState[] = [
    { id: "plc", name: "PLC", kind: "plc", network: { ip: "192.168.1.10", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
    { id: "vfd", name: "VFD", kind: "vfd", network: { ip: "192.168.1.20", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
    { id: "pc", name: "PC", kind: "pc", network: { ip: "192.168.1.50", subnet: "255.255.255.0", gateway: "192.168.1.1" }, poweredOn: true, cableConnected: true },
  ];
  return base.map((d) => ({ ...d, ...(overrides[d.id] ?? {}), network: { ...d.network, ...(overrides[d.id]?.network ?? {}) } }));
}

describe("isValidIpv4", () => {
  it("accepts valid addresses", () => {
    expect(isValidIpv4("192.168.1.10")).toBe(true);
    expect(isValidIpv4("0.0.0.0")).toBe(true);
    expect(isValidIpv4("255.255.255.255")).toBe(true);
  });
  it("rejects malformed addresses", () => {
    expect(isValidIpv4("192.168.1")).toBe(false);
    expect(isValidIpv4("192.168.1.256")).toBe(false);
    expect(isValidIpv4("not-an-ip")).toBe(false);
  });
});

describe("sameSubnet", () => {
  it("treats hosts in the same /24 as the same subnet", () => {
    expect(sameSubnet("192.168.1.10", "192.168.1.20", "255.255.255.0")).toBe(true);
  });
  it("treats hosts in different /24s as different subnets", () => {
    expect(sameSubnet("192.168.1.10", "192.168.2.20", "255.255.255.0")).toBe(false);
  });
});

describe("ping", () => {
  it("succeeds when both devices are on the same healthy subnet", () => {
    const devices = makeDevices();
    const result = ping("plc", "192.168.1.20", devices);
    expect(result.ok).toBe(true);
    expect(result.kind).toBe("success");
    expect(result.resolvedDeviceId).toBe("vfd");
  });

  it("reports unreachable_subnet — the core Work Order #1001 fault", () => {
    const devices = makeDevices({ vfd: { network: { ip: "192.168.2.20", subnet: "255.255.255.0", gateway: "192.168.1.1" } } });
    const result = ping("plc", "192.168.1.20", devices);
    expect(result.ok).toBe(false);
    expect(result.kind).toBe("timeout"); // no device currently holds 192.168.1.20
  });

  it("reports unreachable_subnet when pinging the misconfigured VFD directly", () => {
    const devices = makeDevices({ vfd: { network: { ip: "192.168.2.20", subnet: "255.255.255.0", gateway: "192.168.1.1" } } });
    const result = ping("plc", "192.168.2.20", devices);
    expect(result.ok).toBe(false);
    expect(result.kind).toBe("unreachable_subnet");
  });

  it("reports cable_disconnected", () => {
    const devices = makeDevices({ vfd: { cableConnected: false } });
    const result = ping("plc", "192.168.1.20", devices);
    expect(result.kind).toBe("cable_disconnected");
  });

  it("reports powered_off", () => {
    const devices = makeDevices({ vfd: { poweredOn: false } });
    const result = ping("plc", "192.168.1.20", devices);
    expect(result.kind).toBe("powered_off");
  });

  it("reports duplicate_ip when two devices share an address", () => {
    const devices = makeDevices({ vfd: { network: { ip: "192.168.1.50", subnet: "255.255.255.0", gateway: "192.168.1.1" } } });
    const result = ping("plc", "192.168.1.50", devices);
    expect(result.kind).toBe("duplicate_ip");
    expect(result.ok).toBe(false);
  });

  it("times out for an address nobody holds", () => {
    const devices = makeDevices();
    const result = ping("plc", "192.168.1.99", devices);
    expect(result.kind).toBe("timeout");
  });
});

describe("discover", () => {
  it("lists every other device with its reachability", () => {
    const devices = makeDevices({ vfd: { network: { ip: "192.168.2.20", subnet: "255.255.255.0", gateway: "192.168.1.1" } } });
    const results = discover("plc", devices);
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.id === "vfd")?.reachable).toBe(false);
    expect(results.find((r) => r.id === "pc")?.reachable).toBe(true);
  });
});
