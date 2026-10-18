const KG_TO_LB = 2.20462;

export function kgToLb(kg) {
  return Math.round(Number(kg) * KG_TO_LB * 10) / 10;
}

export function lbToKg(lb) {
  return Math.round((Number(lb) / KG_TO_LB) * 10) / 10;
}

export function cmToFeetInches(cm) {
  const totalIn = Number(cm) / 2.54;
  const ft = Math.floor(totalIn / 12);
  const inches = Math.round(totalIn % 12);
  return { ft, inches };
}

export function feetInchesToCm(ft, inches) {
  return Math.round((Number(ft) * 12 + Number(inches)) * 2.54);
}

export function weightLabel(units) {
  return units === "imperial" ? "lb" : "kg";
}

export function displayWeight(kg, units) {
  if (kg == null || kg === "") return "";
  return units === "imperial" ? kgToLb(kg) : Number(kg);
}

export function toStorageWeight(value, units) {
  if (value === "" || value == null) return 0;
  return units === "imperial" ? lbToKg(value) : Number(value);
}
