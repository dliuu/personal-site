export function archVoussoirs(
  count: number,
  radius: number,
): { position: [number, number, number]; rotation: number }[] {
  if (count < 1 || radius <= 0)
    throw new Error("archVoussoirs needs count >= 1 and radius > 0");
  return Array.from({ length: count }, (_, i) => {
    const theta = (Math.PI * (i + 0.5)) / count;
    return {
      position: [radius * Math.cos(theta), radius * Math.sin(theta), 0],
      rotation: theta - Math.PI / 2,
    };
  });
}
