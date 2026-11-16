export type PackageLine = {
  kind: "labor" | "part" | "other";
  description: string;
  amount: number;
};

export type JobPackage = {
  id: string;
  label: string;
  lines: PackageLine[];
};

/** Fixed shop templates — amounts are editable after insert via re-add if needed. */
export const JOB_PACKAGES: JobPackage[] = [
  {
    id: "oil",
    label: "+ Periyodik Yağ Bakımı",
    lines: [
      { kind: "part", description: "Motor yağı", amount: 1500 },
      { kind: "part", description: "Yağ filtresi", amount: 350 },
      { kind: "part", description: "Hava filtresi", amount: 400 },
      { kind: "labor", description: "Periyodik bakım işçiliği", amount: 800 },
    ],
  },
  {
    id: "front_brake",
    label: "+ Ön Fren Balata Değişimi",
    lines: [
      { kind: "part", description: "Ön fren balata seti", amount: 2200 },
      { kind: "labor", description: "Ön balata değişim işçiliği", amount: 900 },
    ],
  },
  {
    id: "timing",
    label: "+ Triger Seti Değişimi",
    lines: [
      { kind: "part", description: "Triger seti", amount: 4500 },
      { kind: "labor", description: "Triger değişim işçiliği", amount: 2500 },
    ],
  },
  {
    id: "winter",
    label: "+ Kışlık Bakım",
    lines: [
      { kind: "part", description: "Antifriz", amount: 600 },
      { kind: "part", description: "Silecek lastiği", amount: 450 },
      { kind: "labor", description: "Kışlık kontrol işçiliği", amount: 700 },
    ],
  },
];
