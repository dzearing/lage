import crypto from "crypto";

const nameToColorMap = new Map<string, number>();
const packageColors = ["#e5b567", "#b4d273", "#e87d3e", "#9e86c8", "#b05279", "#6c99bb"];

export function getAssignedColor(name: string): string {
  if (!nameToColorMap.has(name)) {
    const index = hashStringToNumber(name) % packageColors.length;
    nameToColorMap.set(name, index);
  }

  return packageColors[nameToColorMap.get(name)!];
}

function hashStringToNumber(str: string): number {
  const hash = crypto.createHash("md5");
  hash.update(str);
  const hex = hash.digest("hex").substring(0, 6);
  return parseInt(hex, 16);
}
