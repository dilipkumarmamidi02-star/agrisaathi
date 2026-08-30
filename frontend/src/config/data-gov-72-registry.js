/*
 * ============================================================
 * AGRISAATHI DATA.GOV.IN — EXACT 72 RESOURCE REGISTRY
 * ============================================================
 *
 * Resource IDs are preserved exactly as supplied.
 *
 * This file is a FEATURE ROUTING REGISTRY.
 *
 * It does NOT claim that every resource is currently reachable.
 * Actual source availability and ingestion must be verified by
 * the backend/API layer.
 *
 * Multiple resources intentionally map to one existing feature.
 * This prevents duplicate application pages.
 * ============================================================
 */

export const DATA_GOV_72_RESOURCES = [

  {
    key: 1,
    name: "Current Daily Price of Various Commodities from Various Markets (Mandi)",
    resource_id: "9ef84268-d588-465a-a308-a864a43d0070",
    primary_feature: "Market Prices",
    secondary_features: ["Marketplace", "RAG Market Intelligence"],
    route: "/market-prices",
    temporal_status: "CURRENT"
  },

  {
    key: 2,
    name: "Variety-wise Daily Market Prices Data of Commodity",
    resource_id: "35985678-0d79-46b4-9ed6-6f13308a1d24",
    primary_feature: "Market Prices",
    secondary_features: ["Crops", "Marketplace"],
    route: "/market-prices",
    temporal_status: "CURRENT"
  },

  {
    key: 3,
    name: "Daily Data of Soil Moisture during January 2022",
    resource_id: "4554a3c8-74e3-4f93-8727-8fd92161e345",
    primary_feature: "Soil Passport",
    secondary_features: ["Irrigation", "Water"],
    route: "/soil-passport",
    temporal_status: "HISTORICAL"
  },

  {
    key: 4,
    name: "Fertilizer-wise Details of Demand, Availability, Consumption and Closing Stock of Fertilizers during Ongoing Rabi 2024-25",
    resource_id: "e636c081-9a0a-45ed-8531-d3d33f31f90c",
    primary_feature: "Fertilizer",
    secondary_features: ["Market Intelligence"],
    route: "/fertilizer",
    temporal_status: "CURRENT"
  },

  {
    key: 5,
    name: "Details Of Year-wise Subsidy On Fertilizer Products",
    resource_id: "2e0e6c04-97f2-456b-9309-bf605650cb11",
    primary_feature: "Fertilizer",
    secondary_features: ["Government Schemes"],
    route: "/fertilizer",
    temporal_status: "HISTORICAL"
  },

  {
    key: 6,
    name: "State/UT-wise Details of Demand, Supply and Consumption of All Fertilizer During Kharif 2024-25",
    resource_id: "7ea27976-ff4e-4077-8c3b-ca3bc14a0bb8",
    primary_feature: "Fertilizer",
    secondary_features: ["Market Intelligence"],
    route: "/fertilizer",
    temporal_status: "CURRENT"
  },

  {
    key: 7,
    name: "Pesticides Dealers License Report",
    resource_id: "8db62b11-d6a1-41bd-8d9d-5d560b47b8a6",
    primary_feature: "Pesticide Library",
    secondary_features: [],
    route: "/pest-library",
    temporal_status: "UNKNOWN"
  },

  {
    key: 8,
    name: "Daily FCI Stock Position of the Commodity",
    resource_id: "60eed46c-190a-45e1-9807-c5b37f960fff",
    primary_feature: "Market Prices",
    secondary_features: ["Marketplace"],
    route: "/market-prices",
    temporal_status: "CURRENT"
  },

  {
    key: 9,
    name: "All India Pincode Directory till last month",
    resource_id: "5c2f62fe-5afa-4119-a499-fec9d604d5bd",
    primary_feature: "Near Me",
    secondary_features: ["Location Context", "Profile/Location"],
    route: "/near-me",
    temporal_status: "CURRENT"
  },

  {
    key: 10,
    name: "Production of Milk",
    resource_id: "271bc0bf-0901-43ac-b91b-bb9b2b3c0722",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "UNKNOWN"
  },

  {
    key: 11,
    name: "State/UT-wise Details of Change in Milk Production and Productivity from 2014-15 to 2023-24",
    resource_id: "644e432a-9e2f-4bf4-a1a1-4c79573a741c",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 12,
    name: "State/UT-wise Details of Release of Funds under ATMA Scheme from 2017-18 to 2021-22",
    resource_id: "c9d2926c-97d5-4c90-8250-8a73f1c31d97",
    primary_feature: "Government Schemes",
    secondary_features: ["Training"],
    route: "/schemes",
    temporal_status: "HISTORICAL"
  },

  {
    key: 13,
    name: "Details of the Schemes implemented by The Department of Agriculture, Cooperation & Farmers Welfare across the country",
    resource_id: "9afdf346-16d7-4f17-a2e3-684540c59a77",
    primary_feature: "Government Schemes",
    secondary_features: [],
    route: "/schemes",
    temporal_status: "UNKNOWN"
  },

  {
    key: 14,
    name: "State-wise Percentage of farmers availing crop insurance schemes in the country during 2014-15",
    resource_id: "f6fb3ade-c752-4234-b8be-eee7b1578bea",
    primary_feature: "Insurance",
    secondary_features: [],
    route: "/insurance-hub",
    temporal_status: "HISTORICAL"
  },

  {
    key: 15,
    name: "Village and Gender-wise Beneficiaries Count under PM-KISAN Scheme",
    resource_id: "388208c6-d82a-4190-90df-91aa2c326fec",
    primary_feature: "Government Schemes",
    secondary_features: [],
    route: "/schemes",
    temporal_status: "UNKNOWN"
  },

  {
    key: 16,
    name: "State/UT-wise Number of Eligible Beneficiaries under PM Kisan Samman Nidhi Yojana",
    resource_id: "bb4d3a19-ee01-4775-ac2e-11458fab7a1a",
    primary_feature: "Government Schemes",
    secondary_features: [],
    route: "/schemes",
    temporal_status: "UNKNOWN"
  },

  {
    key: 17,
    name: "Year-wise Details of Funds Allocated and Utilised under PMFBY from 2020-21 to 2024-25",
    resource_id: "2c0d784b-de75-42e5-9146-689eb0ba407a",
    primary_feature: "Insurance",
    secondary_features: ["Government Schemes"],
    route: "/insurance-hub",
    temporal_status: "HISTORICAL"
  },

  {
    key: 18,
    name: "Crop-wise Procurement of Farmer Crop at Minimum Support Price (MSP) Rate for Central Pool during 2022-23",
    resource_id: "27a67470-c301-4794-8ecf-e26ab2d229db",
    primary_feature: "Market Prices",
    secondary_features: ["Crops", "Harvest"],
    route: "/market-prices",
    temporal_status: "HISTORICAL"
  },

  {
    key: 19,
    name: "State/UT-wise Number of Farmers Field School (FFS) conducted by CIPMC from 2019-20 to 2024-25",
    resource_id: "b66778b3-65cf-4640-9a3f-3d576c7f7483",
    primary_feature: "Training",
    secondary_features: [],
    route: "/training-center",
    temporal_status: "HISTORICAL"
  },

  {
    key: 20,
    name: "Disease Burden Estimation 2005",
    resource_id: "f0ddee5e-4b4b-4b43-9512-a0edcd5f2764",
    primary_feature: "Verified RAG / Other Knowledge",
    secondary_features: [],
    route: "/",
    temporal_status: "HISTORICAL"
  },

  {
    key: 21,
    name: "Year-wise Details of Fund Allocated and Utilized under Livestock Health & Disease Control Programme (LHDCP)",
    resource_id: "6c8e7211-1cd8-4395-b913-f8169d84701a",
    primary_feature: "Livestock",
    secondary_features: ["Government Schemes"],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 22,
    name: "Real time Air Quality Index from various locations",
    resource_id: "3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69",
    primary_feature: "Weather",
    secondary_features: ["Environment"],
    route: "/weather",
    temporal_status: "CURRENT"
  },

  {
    key: 23,
    name: "Seasonal and Annual Mean Temperature Series for the period 1901-2021",
    resource_id: "45787c4b-3210-4fd0-b120-63336e042370",
    primary_feature: "Weather",
    secondary_features: [],
    route: "/weather",
    temporal_status: "HISTORICAL"
  },

  {
    key: 24,
    name: "District-wise, season-wise crop production statistics from 1997",
    resource_id: "35be999b-0208-4354-b557-f6ca9a5355de",
    primary_feature: "Crops",
    secondary_features: ["Crop Planner", "Market Intelligence"],
    route: "/crops",
    temporal_status: "HISTORICAL"
  },

  {
    key: 25,
    name: "List of certified varieties of horticultural crops",
    resource_id: "46f587a9-7476-443e-915f-fc756a6b4e2c",
    primary_feature: "Crops",
    secondary_features: ["Crop Planner"],
    route: "/crops",
    temporal_status: "UNKNOWN"
  },

  {
    key: 26,
    name: "Kisan Call Centre (KCC) - Transcripts of farmers queries & answers",
    resource_id: "cef25fe2-9231-4128-8aec-2c948fedd43f",
    primary_feature: "Speak to AgriSaathi",
    secondary_features: [],
    route: "/speak-to-agrisaathi",
    temporal_status: "HISTORICAL"
  },

  {
    key: 27,
    name: "State & UT-wise Number of Veterinary Institutions As On 31.03.2015",
    resource_id: "7d21b6cf-3382-46fd-884d-7df485cfedaf",
    primary_feature: "Animal Encyclopedia",
    secondary_features: ["Livestock"],
    route: "/animal-encyclopedia",
    temporal_status: "HISTORICAL"
  },

  {
    key: 28,
    name: "Product wise and Month wise production of chemical Fertilizers",
    resource_id: "373358c8-63fd-4612-8f2b-9ce483422312",
    primary_feature: "Fertilizer",
    secondary_features: [],
    route: "/fertilizer",
    temporal_status: "HISTORICAL"
  },

  {
    key: 29,
    name: "Details Of Number of Dealers In Each District Of India of Chemical Fertilizers Upto 2013-14",
    resource_id: "56f40018-fd03-4010-94a3-f34ca7b43f7c",
    primary_feature: "Fertilizer",
    secondary_features: ["Near Me"],
    route: "/fertilizer",
    temporal_status: "HISTORICAL"
  },

  {
    key: 30,
    name: "Sector-wise distribution of cold storages in India (as on 31.12.2009)",
    resource_id: "0b827ac7-ebad-47c1-9cc9-816ce4ab10a7",
    primary_feature: "Harvest",
    secondary_features: ["Marketplace"],
    route: "/harvest-records",
    temporal_status: "HISTORICAL"
  },

  {
    key: 31,
    name: "All India level Index Numbers of Yield of Principal Crops from 2007-08 to 2015-16",
    resource_id: "f055c331-6cf3-4b74-bb58-d44161e32bfa",
    primary_feature: "Crops",
    secondary_features: ["Crop Planner"],
    route: "/crops",
    temporal_status: "HISTORICAL"
  },

  {
    key: 32,
    name: "Demand and Supply of Commodities during Twelfth Plan",
    resource_id: "27ac86aa-0352-4c13-8711-23d4720d82ea",
    primary_feature: "Market Prices",
    secondary_features: ["Marketplace"],
    route: "/market-prices",
    temporal_status: "HISTORICAL"
  },

  {
    key: 33,
    name: "Animals Insured under Livestock Insurance Scheme of GoI in India from 2006-07 onwards",
    resource_id: "24a8786a-28d5-4401-ac39-b61d029011a1",
    primary_feature: "Animal Encyclopedia",
    secondary_features: ["Insurance", "Livestock"],
    route: "/animal-encyclopedia",
    temporal_status: "HISTORICAL"
  },

  {
    key: 34,
    name: "District-wise Details of Livestock Population in Himachal Pradesh - 20th Livestock Census 2019",
    resource_id: "819e6f8f-f47a-4cf4-888d-1339b4a4f4ad",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 35,
    name: "District-wise Details of Livestock Population in Sikkim - 20th Livestock Census 2019",
    resource_id: "0c61ebaf-5b93-44ce-a50e-d313ee09b639",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 36,
    name: "District-wise Details of Livestock Population in Haryana - 20th Livestock Census 2019",
    resource_id: "d8b39a01-5aa8-419a-a6a0-6a7f5d9b47d2",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 37,
    name: "District-wise Details of Livestock Population in Rajasthan - 20th Livestock Census 2019",
    resource_id: "f16b0fcb-62e4-4777-9a9e-52c0ab69940b",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 38,
    name: "District-wise Details of Livestock Population in Gujarat - 20th Livestock Census 2019",
    resource_id: "339fbef8-8d3e-4c70-a1e1-759d2f25211f",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 39,
    name: "District-wise Details of Livestock Population in Punjab - 20th Livestock Census 2019",
    resource_id: "406217bf-76c4-442a-89ef-ecc8c6708c95",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 40,
    name: "District-wise Details of Livestock Population in Goa - 20th Livestock Census 2019",
    resource_id: "3ac95c73-0a21-4d05-9e01-6276471af711",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 41,
    name: "District-wise Details of Livestock Population in Puducherry - 20th Livestock Census 2019",
    resource_id: "b5614586-e093-4aae-9983-b699c21f09a6",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 42,
    name: "District-wise Details of Livestock Population in Daman and Diu - 20th Livestock Census 2019",
    resource_id: "87e31c05-bd02-4241-85f4-c7fc6fa98a68",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 43,
    name: "District-wise Details of Livestock Population in Odisha - 20th Livestock Census 2019",
    resource_id: "18658cc3-c778-4482-bd2b-bcbf1dbb309d",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 44,
    name: "District-wise Details of Livestock Population in Dadra And Nagar Haveli - 20th Livestock Census 2019",
    resource_id: "0c67102e-d2d4-48c0-a4af-f88be236d486",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 45,
    name: "District-wise Details of Livestock Population in Nagaland - 20th Livestock Census 2019",
    resource_id: "24923144-653a-489e-bf2b-69013a94e53b",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 46,
    name: "District-wise Details of Livestock Population in Chhattisgarh - 20th Livestock Census 2019",
    resource_id: "70480cbe-1d80-433f-b601-7f657e8fe090",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 47,
    name: "District-wise Details of Livestock Population in Mizoram - 20th Livestock Census 2019",
    resource_id: "7cb44e0b-2676-4782-983c-231ae41abaf4",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 48,
    name: "District-wise Details of Livestock Population in Meghalaya - 20th Livestock Census 2019",
    resource_id: "f63903c2-8e1d-4d5d-b059-d939f25aae0b",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 49,
    name: "District-wise Details of Livestock Population in Chandigarh - 20th Livestock Census 2019",
    resource_id: "dd873e0f-d23a-41d4-83c7-4bac87b62397",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 50,
    name: "District-wise Details of Livestock Population in Manipur - 20th Livestock Census 2019",
    resource_id: "3ebc4ca9-8ed7-4ae8-a0b0-07c879d0f024",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 51,
    name: "District-wise Details of Livestock Population in Bihar - 20th Livestock Census 2019",
    resource_id: "8b43a5f3-8c61-4dfe-8e28-98b9734b625c",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 52,
    name: "District-wise Details of Livestock Population in Maharashtra - 20th Livestock Census 2019",
    resource_id: "0935d4a7-647e-49ac-a28e-b0890342515c",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 53,
    name: "District-wise Details of Livestock Population in Assam - 20th Livestock Census 2019",
    resource_id: "6ef56e3a-6d60-4170-ab2d-bdf6e181a12b",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 54,
    name: "District-wise Details of Livestock Population in Madhya Pradesh - 20th Livestock Census 2019",
    resource_id: "de0d9673-8d01-48c5-8cdd-65ca7ced4bf4",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 55,
    name: "District-wise Details of Livestock Population in West Bengal - 20th Livestock Census 2019",
    resource_id: "4e92f370-ee59-4d97-871f-0108b32df4f7",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 56,
    name: "District-wise Details of Livestock Population in Arunachal Pradesh - 20th Livestock Census 2019",
    resource_id: "7a7f44c0-860b-43dd-b6c5-dbcd7f846221",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 57,
    name: "District-wise Details of Livestock Population in Lakshadweep - 20th Livestock Census 2019",
    resource_id: "6d28e51c-1a6f-44ed-919b-5b5e63576039",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 58,
    name: "District-wise Details of Livestock Population in Uttarakhand - 20th Livestock Census 2019",
    resource_id: "734c8386-42b1-4c8c-86f1-be6a20fd14c0",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 59,
    name: "District-wise Details of Livestock Population in Andhra Pradesh - 20th Livestock Census 2019",
    resource_id: "d5d764b5-ea87-4665-8c1a-22c2a10f7e66",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 60,
    name: "District-wise Details of Livestock Population in Kerala - 20th Livestock Census 2019",
    resource_id: "6a35cf54-7fea-4b25-8493-6c3e2fe72529",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 61,
    name: "District-wise Details of Livestock Population in Uttar Pradesh - 20th Livestock Census 2019",
    resource_id: "58323ceb-b546-4395-af3b-76efadb6907b",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 62,
    name: "District-wise Details of Livestock Population in Andaman Nicobar - 20th Livestock Census 2019",
    resource_id: "846d21d7-0fc7-4c91-a853-2081647ce601",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 63,
    name: "District-wise Details of Livestock Population in Karnataka - 20th Livestock Census 2019",
    resource_id: "54411c6a-fc46-49b0-bca2-7433fabcef81",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 64,
    name: "District-wise Details of Livestock Population in Tripura - 20th Livestock Census 2019",
    resource_id: "28fc86c8-82c8-4f19-af07-749de58abe3f",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 65,
    name: "District-wise Details of Livestock Population in Jharkhand - 20th Livestock Census 2019",
    resource_id: "93f4744f-2dc2-47f9-a3b1-f8700124ab15",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 66,
    name: "District-wise Details of Livestock Population in Telangana - 20th Livestock Census 2019",
    resource_id: "317f3cbd-75f4-422d-8e53-7282ce4b1cfd",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 67,
    name: "District-wise Details of Livestock Population in Jammu And Kashmir - 20th Livestock Census 2019",
    resource_id: "a3f30913-cd7a-4465-97c4-c54f0c962721",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 68,
    name: "District-wise Details of Livestock Population in Tamil Nadu - 20th Livestock Census 2019",
    resource_id: "297b2340-3751-446d-8c56-7a4f4a6fde86",
    primary_feature: "Livestock",
    secondary_features: [],
    route: "/livestock-care",
    temporal_status: "HISTORICAL"
  },

  {
    key: 69,
    name: "Pattern of Land Utilisation",
    resource_id: "3e07efd9-3ced-4c65-909c-6ca792daab83",
    primary_feature: "Soil Passport",
    secondary_features: ["Water/Land", "Crop Planner"],
    route: "/soil-passport",
    temporal_status: "UNKNOWN"
  },

  {
    key: 70,
    name: "Year-wise Damage Caused Due To Floods, Cyclonic Storm, Landslides etc",
    resource_id: "f5fc3381-dfca-4b22-bf10-dd8f03996b05",
    primary_feature: "Weather",
    secondary_features: ["Alerts"],
    route: "/weather",
    temporal_status: "HISTORICAL"
  },

  {
    key: 71,
    name: "State/UT-wise Consumption of Bio-Pesticides from 2018-19 to 2020-21",
    resource_id: "ee0cd37f-f3ed-4d9a-9e4f-0a85162f89cd",
    primary_feature: "Pesticide Library",
    secondary_features: ["Crops"],
    route: "/pest-library",
    temporal_status: "HISTORICAL"
  },

  {
    key: 72,
    name: "State-wise Status of development and upgradation of Gramin Agricultural Markets under MGNREGS as on 01.02.2021",
    resource_id: "316e825f-096e-47e2-8da5-f5a625cbe9c1",
    primary_feature: "Marketplace",
    secondary_features: ["Government Schemes"],
    route: "/marketplace",
    temporal_status: "HISTORICAL"
  }

];

export const EXPECTED_RESOURCE_COUNT = 72;

export const KCC_RESOURCE_ID =
  "cef25fe2-9231-4128-8aec-2c948fedd43f";

export const LIVESTOCK_RESOURCE_START = 34;

export const LIVESTOCK_RESOURCE_END = 68;

export const LIVESTOCK_RESOURCE_KEYS =
  Array.from(
    { length: LIVESTOCK_RESOURCE_END - LIVESTOCK_RESOURCE_START + 1 },
    (_, index) => index + LIVESTOCK_RESOURCE_START
  );

export default DATA_GOV_72_RESOURCES;
