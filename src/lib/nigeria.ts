export const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT - Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondu","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

export const PACKAGE_TYPES = [
  { value: "document", label: "Document" },
  { value: "parcel_small", label: "Small parcel" },
  { value: "parcel_medium", label: "Medium parcel" },
  { value: "parcel_large", label: "Large parcel" },
  { value: "pallet", label: "Pallet" },
  { value: "fragile", label: "Fragile" },
  { value: "perishable", label: "Perishable" },
  { value: "vehicle", label: "Vehicle" },
  { value: "other", label: "Other" },
] as const;
