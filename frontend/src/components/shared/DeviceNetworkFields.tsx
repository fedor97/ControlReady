import { useEffect, useState } from "react";
import { useSimStore } from "../../state/simStore";
import { isValidIpv4 } from "../../engine/networkEngine";
import type { DeviceId } from "../../types";

/**
 * IP / Subnet / Gateway editor for one device — the single implementation shared by
 * the Network Tools "IP Config" tab and the VFD/PLC device inspector's "Network" tab.
 */
export function DeviceNetworkFields({ deviceId, compact }: { deviceId: DeviceId; compact?: boolean }) {
  const device = useSimStore((s) => s.devices.find((d) => d.id === deviceId));
  const updateDeviceNetwork = useSimStore((s) => s.updateDeviceNetwork);

  const [ip, setIp] = useState(device?.network.ip ?? "");
  const [subnet, setSubnet] = useState(device?.network.subnet ?? "");
  const [gateway, setGateway] = useState(device?.network.gateway ?? "");

  useEffect(() => {
    if (!device) return;
    setIp(device.network.ip);
    setSubnet(device.network.subnet);
    setGateway(device.network.gateway);
  }, [device?.network.ip, device?.network.subnet, device?.network.gateway]);

  if (!device) return null;
  const currentNetwork = device.network;

  const dirty = ip !== currentNetwork.ip || subnet !== currentNetwork.subnet || gateway !== currentNetwork.gateway;
  const valid = isValidIpv4(ip) && isValidIpv4(subnet) && isValidIpv4(gateway);
  const ipLooksWrong = isValidIpv4(ip) && ip !== currentNetwork.ip; // being edited but not yet applied

  function apply() {
    if (!valid) return;
    const patch: Partial<{ ip: string; subnet: string; gateway: string }> = {};
    if (ip !== currentNetwork.ip) patch.ip = ip;
    if (subnet !== currentNetwork.subnet) patch.subnet = subnet;
    if (gateway !== currentNetwork.gateway) patch.gateway = gateway;
    updateDeviceNetwork(deviceId, patch);
  }

  const fieldClass = `field-flat w-full px-2 py-1.5 font-mono-industrial text-cr-text ${compact ? "text-[11px]" : "text-xs"}`;
  const ipFieldStyle = ipLooksWrong ? { boxShadow: "inset 0 0 0 1px var(--color-cr-warn)" } : undefined;

  return (
    <div>
      <div className={`grid grid-cols-3 gap-2 ${compact ? "gap-1.5" : ""}`}>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-cr-text-dim">IP Address</span>
          <input value={ip} onChange={(e) => setIp(e.target.value)} className={fieldClass} style={ipFieldStyle} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-cr-text-dim">Subnet Mask</span>
          <input value={subnet} onChange={(e) => setSubnet(e.target.value)} className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wide text-cr-text-dim">Gateway</span>
          <input value={gateway} onChange={(e) => setGateway(e.target.value)} className={fieldClass} />
        </label>
      </div>
      <button
        disabled={!dirty || !valid}
        onClick={apply}
        className="btn mt-2 w-full py-1.5 text-xs"
        style={{ background: "var(--color-cr-info)", color: "var(--color-cr-bg)" }}
      >
        Edit Network Settings
      </button>
    </div>
  );
}
