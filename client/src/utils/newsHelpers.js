export const CLIMATE_KEYWORDS = [
  "climate", "weather", "global warming", "climate change",
  "flood", "drought", "storm", "hurricane", "typhoon",
  "rain", "heatwave", "wildfire", "carbon", "greenhouse"
];

export const REGION_MAPPING = {
  US: "North America", CA: "North America", MX: "North America", BR: "South America",
  AR: "South America", CO: "South America", CL: "South America", PE: "South America",
  VE: "South America", GB: "Europe", FR: "Europe", DE: "Europe", IT: "Europe",
  ES: "Europe", NL: "Europe", BE: "Europe", CH: "Europe", AT: "Europe", SE: "Europe",
  NO: "Europe", DK: "Europe", FI: "Europe", CN: "Asia", IN: "Asia", JP: "Asia",
  KR: "Asia", TH: "Asia", SG: "Asia", MY: "Asia", ID: "Asia", PH: "Asia",
  VN: "Asia", ZA: "Africa", NG: "Africa", EG: "Africa", KE: "Africa",
  GH: "Africa", MA: "Africa", TZ: "Africa", UG: "Africa", ET: "Africa", RW: "Africa",
  AU: "Oceania", NZ: "Oceania", RU: "Europe", UA: "Europe", PL: "Europe",
  CZ: "Europe", HU: "Europe", PT: "Europe", GR: "Europe", IE: "Europe", IS: "Europe",
  AR: "South America", UY: "South America", PY: "South America", BO: "South America",
  CL: "South America", EC: "South America", PE: "South America", VE: "South America",
  CA: "North America", US: "North America", MX: "North America", GT: "North America",
  HN: "North America", NI: "North America", CR: "North America", PA: "North America",
  CU: "North America", DO: "North America", HT: "North America", JM: "North America",
  BB: "North America", BS: "North America", AG: "North America", DM: "North America",
  GD: "North America", LC: "North America", VC: "North America", KN: "North America",
  TT: "North America", FJ: "Oceania", PG: "Oceania", SB: "Oceania", VU: "Oceania",
  WS: "Oceania", KI: "Oceania", TV: "Oceania", TO: "Oceania", NR: "Oceania",
  MH: "Oceania", PW: "Oceania", FM: "Oceania", CN: "Asia", JP: "Asia", KR: "Asia",
  MN: "Asia", TW: "Asia", HK: "Asia", MO: "Asia", IN: "Asia", PK: "Asia", BD: "Asia",
  NP: "Asia", LK: "Asia", BT: "Asia", MM: "Asia", TH: "Asia", LA: "Asia", KH: "Asia",
  VN: "Asia", MY: "Asia", SG: "Asia", ID: "Asia", PH: "Asia", BN: "Asia", KZ: "Asia",
  UZ: "Asia", TM: "Asia", KG: "Asia", TJ: "Asia", AF: "Asia", SA: "Asia", AE: "Asia",
  QA: "Asia", BH: "Asia", OM: "Asia", KW: "Asia", YE: "Asia", IR: "Asia", IQ: "Asia",
  SY: "Asia", JO: "Asia", LB: "Asia", PS: "Asia", IL: "Asia", TR: "Europe", RU: "Europe",
  BY: "Europe", MD: "Europe", UA: "Europe", GE: "Asia", AM: "Asia", AZ: "Asia"
};

export const normalizeText = (text) => text?.toLowerCase().trim() || "";

export const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Unknown";
  }
};

export const getRegion = (item) => {
  if (item.country) return REGION_MAPPING[item.country.toUpperCase()] || "Global";
  if (item.source) {
    const sourceName = typeof item.source === "string" ? item.source : item.source?.name || "";
    const sourceText = sourceName.toLowerCase();
    for (const [key, region] of Object.entries(REGION_MAPPING)) {
      if (sourceText.includes(key.toLowerCase())) return region;
    }
  }
  return "Global";
};

export const deduplicateItems = (items) => {
  const map = new Map();
  items.forEach(item => {
    const url = item.url;
    if (url && !map.has(url)) map.set(url, item);
  });
  return Array.from(map.values());
};

export const sortByDate = (items) => [...items].sort((a, b) => {
  const dateA = new Date(a.publishedAt || a.date || a.created_at || 0);
  const dateB = new Date(b.publishedAt || b.date || b.created_at || 0);
  return dateB - dateA;
});
