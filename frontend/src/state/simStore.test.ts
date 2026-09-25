import { describe, expect, it } from "vitest";
import { isFaultResolvedFor } from "./simStore";
import { lab1Definition } from "../labs/lab1-motor-control/definition";
import type { DeviceState, TagTable } from "../types";

const healthyDevices: DeviceState[] = lab1Definition.devices.map((d) => ({ ...d }));
const healthyTags: TagTable = { ...lab1Definition.initialTags };
const fault = lab1Definition.faultCatalog.find((f) => f.id === "wrong_vfd_ip")!;

describe("fault detection — wrong_vfd_ip", () => {
  it("is unresolved while the VFD sits on the wrong subnet", () => {
    const devices = healthyDevices.map((d) => (d.id === "vfd" ? { ...d, network: { ...d.network, ip: "192.168.2.20" } } : d));
    expect(isFaultResolvedFor(lab1Definition, fault, devices, healthyTags)).toBe(false);
  });

  it("is resolved once the VFD IP is corrected", () => {
    expect(isFaultResolvedFor(lab1Definition, fault, healthyDevices, healthyTags)).toBe(true);
  });

  it("stays unresolved if a duplicate IP is introduced elsewhere", () => {
    const devices = healthyDevices.map((d) => (d.id === "vfd" ? { ...d, network: { ...d.network, ip: "192.168.1.50" } } : d));
    expect(isFaultResolvedFor(lab1Definition, fault, devices, healthyTags)).toBe(false);
  });

  it("stays unresolved if the overload relay is tripped", () => {
    expect(isFaultResolvedFor(lab1Definition, fault, healthyDevices, { ...healthyTags, Overload_OK: false })).toBe(false);
  });

  it("stays unresolved if the stop circuit is open", () => {
    expect(isFaultResolvedFor(lab1Definition, fault, healthyDevices, { ...healthyTags, Stop_PB: false })).toBe(false);
  });
});
