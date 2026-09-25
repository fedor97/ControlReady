/**
 * Shared industrial material palette for Lab 1's procedural geometry.
 * Chosen to read as "painted steel / industrial plastic / concrete", not primitive-debug colors.
 * No external assets — see ARCHITECTURE.md §3 for why (no vetted GLTF asset pipeline in this MVP).
 */
export const MAT = {
  cabinetPaint: { color: "#dfe2e6", roughness: 0.5, metalness: 0.12 },
  cabinetDoorInset: { color: "#c7cbd1", roughness: 0.45, metalness: 0.1 },
  darkBezel: { color: "#20242a", roughness: 0.4, metalness: 0.2 },
  plasticHousing: { color: "#33383f", roughness: 0.35, metalness: 0.12 },
  plasticHousingLight: { color: "#454b54", roughness: 0.35, metalness: 0.15 },
  steelFrame: { color: "#8a9099", roughness: 0.4, metalness: 0.7 },
  steelDark: { color: "#5b6169", roughness: 0.45, metalness: 0.55 },
  motorHousing: { color: "#3d4652", roughness: 0.4, metalness: 0.55 },
  rubberBelt: { color: "#22252a", roughness: 0.9, metalness: 0.05 },
  psuBlue: { color: "#2f5d7a", roughness: 0.4, metalness: 0.3 },
  safetyYellow: { color: "#f2b705", roughness: 0.6, metalness: 0.05 },
  deskLaminate: { color: "#6b5a45", roughness: 0.55, metalness: 0.05 },
  chairFabric: { color: "#2b2f37", roughness: 0.8, metalness: 0.02 },
  rackHousing: { color: "#26292f", roughness: 0.4, metalness: 0.3 },
  wallPaint: { color: "#aab0b8", roughness: 0.8, metalness: 0.03 },
  floorConcrete: { color: "#8b8f93", roughness: 0.85, metalness: 0.02 },
  ceilingTile: { color: "#c9ccd1", roughness: 0.85, metalness: 0.02 },
  baseboard: { color: "#4a4f56", roughness: 0.6, metalness: 0.1 },
} as const;
