import type { Category } from "./types";

const NYC = "data.cityofnewyork.us";

const MTA_FEEDS = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/";

/**
 * Hackathon category set — focused on live APIs and "find communities".
 * Every dataset is queryable in real-time (Socrata SODA, GBFS, GTFS-RT).
 * No static bulk downloads.
 */

export const CATEGORIES: Category[] = [
  // ───────── Transit & Mobility (live) ─────────
  {
    id: "mta-bus-live",
    name: "Live MTA Buses",
    theme: "transit",
    icon: "Bus",
    description: "Real-time GPS positions of ~1,900 MTA buses across all boroughs.",
    kind: "points",
    refresh: 30,
    datasets: [
      {
        protocol: "gtfs-rt",
        feedUrls: [
          "https://gtfsrt.prod.obanyc.com/vehiclePositions?key=test",
        ],
        entity: "vehicle",
      },
    ],
    paint: { color: "#22d3ee", radius: 3, haloColor: "#062e36" },
    popup: {
      title: "Bus {route_id}",
      fields: [
        { key: "current_status", label: "Status" },
        { key: "stop_id", label: "Next Stop" },
        { key: "bearing", label: "Bearing" },
        { key: "speed", label: "Speed" },
      ],
    },
  },
  {
    id: "nyc-ferry-live",
    name: "Live NYC Ferry",
    theme: "transit",
    icon: "Boat",
    description: "Real-time NYC Ferry vessel positions.",
    kind: "points",
    refresh: 30,
    datasets: [
      {
        protocol: "gtfs-rt",
        feedUrls: [
          "https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/vehicleposition",
        ],
        entity: "vehicle",
      },
    ],
    paint: { color: "#38bdf8", radius: 6, haloColor: "#0c4a6e" },
    popup: {
      title: "Ferry {route_id}",
      fields: [
        { key: "current_status", label: "Status" },
        { key: "stop_id", label: "Next Stop" },
        { key: "speed", label: "Speed" },
      ],
    },
  },
  {
    id: "citi-bike",
    name: "Citi Bike Stations",
    theme: "transit",
    icon: "Lightning",
    description:
      "Live Citi Bike station locations and availability from the GBFS feed.",
    kind: "points",
    refresh: 60,
    datasets: [
      {
        protocol: "gbfs",
        url: "https://gbfs.citibikenyc.com/gbfs/en/station_information.json",
        statusUrl: "https://gbfs.citibikenyc.com/gbfs/en/station_status.json",
      },
    ],
    paint: { color: "#06b6d4", radius: 3, haloColor: "#062436" },
    popup: {
      title: "name",
      fields: [
        { key: "num_bikes_available", label: "Bikes Available" },
        { key: "num_ebikes_available", label: "E-Bikes" },
        { key: "num_docks_available", label: "Docks Free" },
        { key: "capacity", label: "Capacity" },
        { key: "is_renting", label: "Renting" },
        { key: "is_returning", label: "Returning" },
      ],
    },
  },
  {
    id: "bike-network",
    name: "Bike Network",
    theme: "transit",
    icon: "Bicycle",
    description: "NYC DOT bike lanes, paths, and shared streets.",
    kind: "lines",
    datasets: [{ protocol: "socrata", domain: NYC, id: "mzxg-pwib", limit: 30000 }],
    paint: { color: "#34d399", width: 1.8, opacity: 0.9 },
    popup: {
      title: "street",
      fields: [
        { key: "tf_facilit", label: "Facility" },
        { key: "lanecount", label: "Lanes" },
        { key: "fromstreet", label: "From" },
        { key: "tostreet", label: "To" },
      ],
    },
  },
  {
    id: "parking-meters",
    name: "Parking Meters",
    theme: "transit",
    icon: "MapPin",
    description: "ParkNYC metered parking locations.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "693u-uax6", limit: 30000 }],
    paint: { color: "#818cf8", radius: 2, haloColor: "#1e1b4b" },
    popup: {
      title: "on_street",
      fields: [
        { key: "meter_hours", label: "Hours" },
        { key: "status", label: "Status" },
        { key: "from_street", label: "From" },
        { key: "to_street", label: "To" },
        { key: "borough", label: "Borough" },
      ],
    },
  },

  // ───────── Public Safety & 311 ─────────
  {
    id: "311-complaints",
    name: "311 Service Requests",
    theme: "safety",
    icon: "Phone",
    description: "Live NYC 311 complaints — noise, potholes, graffiti, illegal parking, and more.",
    kind: "points",
    cluster: true,
    datasets: [
      {
        protocol: "socrata",
        domain: NYC,
        id: "erm2-nwe9",
        limit: 10000,
        where: "latitude IS NOT NULL",
      },
    ],
    paint: { color: "#f97316", radius: 2, haloColor: "#431407" },
    popup: {
      title: "complaint_type",
      fields: [
        { key: "descriptor", label: "Detail" },
        { key: "incident_address", label: "Address" },
        { key: "borough", label: "Borough" },
        { key: "status", label: "Status" },
        { key: "created_date", label: "Created" },
        { key: "agency_name", label: "Agency" },
      ],
    },
  },
  {
    id: "nypd-crime",
    name: "NYPD Crime Map",
    theme: "safety",
    icon: "ShieldStar",
    description: "Incident-level crime complaints with location data.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "qb7u-rbmr", limit: 10000 }],
    paint: { color: "#ef4444", radius: 2, haloColor: "#3f0a0a" },
    popup: {
      title: "ofns_desc",
      fields: [
        { key: "boro_nm", label: "Borough" },
        { key: "law_cat_cd", label: "Level" },
        { key: "crm_atpt_cptd_cd", label: "Status" },
        { key: "cmplnt_fr_dt", label: "Date" },
        { key: "cmplnt_fr_tm", label: "Time" },
        { key: "loc_of_occur_desc", label: "Location" },
      ],
    },
  },
  {
    id: "nypd-shootings",
    name: "Shooting Incidents",
    theme: "safety",
    icon: "ShieldStar",
    description: "NYPD shooting incident data with locations.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "833y-fsy8", limit: 5000 }],
    paint: { color: "#dc2626", radius: 3, haloColor: "#450a0a" },
    popup: {
      title: "Shooting Incident",
      fields: [
        { key: "boro", label: "Borough" },
        { key: "occur_date", label: "Date" },
        { key: "occur_time", label: "Time" },
        { key: "statistical_murder_flag", label: "Fatal" },
        { key: "perp_sex", label: "Suspect Sex" },
        { key: "vic_sex", label: "Victim Sex" },
        { key: "loc_classfctn_desc", label: "Location Type" },
      ],
    },
  },
  {
    id: "crashes",
    name: "Motor Vehicle Crashes",
    theme: "safety",
    icon: "ShieldStar",
    description: "Recent NYPD-reported motor vehicle collisions.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "h9gi-nx95", limit: 20000 }],
    paint: { color: "#fb923c", radius: 2, haloColor: "#431407" },
    popup: {
      title: "{on_street_name}",
      fields: [
        { key: "crash_date", label: "Date" },
        { key: "crash_time", label: "Time" },
        { key: "number_of_persons_injured", label: "Injured" },
        { key: "number_of_persons_killed", label: "Killed" },
        { key: "contributing_factor_vehicle_1", label: "Cause" },
        { key: "vehicle_type_code1", label: "Vehicle" },
        { key: "borough", label: "Borough" },
      ],
    },
  },
  {
    id: "police-precincts",
    name: "Police Precincts",
    theme: "safety",
    icon: "ShieldStar",
    description: "NYPD precinct boundaries.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "y76i-bdw7", limit: 100 }],
    paint: { color: "#0ea5e9", opacity: 0.07 },
    popup: {
      title: "Precinct {precinct}",
    },
  },

  // ────────�� Nature & Community ─────────
  {
    id: "community-gardens",
    name: "Community Gardens",
    theme: "nature",
    icon: "Park",
    description: "GreenThumb community garden parcels.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "p78i-pat6", limit: 2000 }],
    paint: { color: "#a3e635", opacity: 0.35 },
    popup: {
      title: "gardenname",
      fields: [
        { key: "address", label: "Address" },
        { key: "crossstreets", label: "Cross Streets" },
        { key: "status", label: "Status" },
        { key: "juris", label: "Jurisdiction" },
        { key: "borough", label: "Borough" },
      ],
    },
  },
  {
    id: "parks",
    name: "Parks & Green Space",
    theme: "nature",
    icon: "Park",
    description: "NYC Parks properties: every park and natural area.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "enfh-gkve", limit: 5000 }],
    paint: { color: "#22c55e", opacity: 0.18 },
    popup: {
      title: "name311",
      fields: [
        { key: "typecategory", label: "Type" },
        { key: "subcategory", label: "Subcategory" },
        { key: "acres", label: "Acres" },
        { key: "address", label: "Address" },
        { key: "borough", label: "Borough" },
      ],
    },
  },
  {
    id: "playgrounds",
    name: "Playgrounds & Recreation",
    theme: "nature",
    icon: "Park",
    description: "NYC Parks active and passive recreation areas.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "kcqe-vnci", limit: 5000 }],
    paint: { color: "#84cc16", opacity: 0.18 },
    popup: {
      title: "public_open_space_name",
      fields: [
        { key: "recreation_category", label: "Category" },
        { key: "type_category", label: "Type" },
        { key: "acres", label: "Acres" },
        { key: "borough", label: "Borough" },
        { key: "location", label: "Location" },
      ],
    },
  },
  {
    id: "trees",
    name: "Tree Maps",
    theme: "nature",
    icon: "Tree",
    description: "Every street tree NYC tracks.",
    kind: "points",
    cluster: true,
    datasets: [
      { protocol: "socrata", domain: NYC, id: "hn5i-inap", limit: 50000 },
      { protocol: "socrata", domain: NYC, id: "82zj-84is", limit: 30000 },
    ],
    paint: { color: "#22c55e", radius: 1.8, haloColor: "#052012" },
    popup: {
      title: "genusspecies",
      fields: [
        { key: "dbh", label: "Diameter (in)" },
        { key: "tpcondition", label: "Condition" },
        { key: "parkname", label: "Park" },
        { key: "streetname", label: "Street" },
      ],
    },
  },

  // ───────��─ Buildings & Land ─────────
  {
    id: "landmarks",
    name: "Landmarks",
    theme: "buildings",
    icon: "Buildings",
    description: "Designated and calendared individual landmark buildings & sites.",
    kind: "points",
    datasets: [{ protocol: "socrata", domain: NYC, id: "ncre-qhxs", limit: 5000 }],
    paint: { color: "#a78bfa", radius: 3, haloColor: "#1e1140" },
    popup: {
      title: "lm_name",
      fields: [
        { key: "lm_type", label: "Type" },
        { key: "desig_addr", label: "Address" },
        { key: "desdate", label: "Designated" },
        { key: "status", label: "Status" },
      ],
    },
  },
  {
    id: "pops",
    name: "Privately Owned Public Spaces",
    theme: "buildings",
    icon: "Buildings",
    description: "POPS: privately owned spaces open to the public.",
    kind: "points",
    datasets: [{ protocol: "socrata", domain: NYC, id: "rvih-nhyn", limit: 1000 }],
    paint: { color: "#818cf8", radius: 3.2, haloColor: "#1e1b4b" },
    popup: {
      title: "building_name",
      fields: [
        { key: "public_space_type", label: "Type" },
        { key: "building_address_with_zip", label: "Address" },
        { key: "year_completed", label: "Year Completed" },
        { key: "hour_of_access_required", label: "Access Hours" },
        { key: "physically_disabled", label: "Accessible" },
      ],
    },
  },
  {
    id: "waterfront-access",
    name: "Waterfront Public Access",
    theme: "buildings",
    icon: "Drop",
    description: "Required waterfront public access areas (WPAAs).",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "388s-pnvc", limit: 2000 }],
    paint: { color: "#7dd3fc", opacity: 0.3 },
    popup: {
      title: "name",
      fields: [
        { key: "waterway", label: "Waterway" },
        { key: "status", label: "Status" },
        { key: "hours_open", label: "Hours" },
        { key: "wpaa_area", label: "Area (sqft)" },
      ],
    },
  },
  {
    id: "vacant-storefronts",
    name: "Vacant Storefronts",
    theme: "buildings",
    icon: "Storefront",
    description: "Storefronts reported vacant in DOF surveys.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "92iy-9c3n", limit: 10000 }],
    paint: { color: "#e11d48", radius: 2.5, haloColor: "#3f0a1a" },
    popup: {
      title: "property_street_address_or",
      fields: [
        { key: "primary_business_activity", label: "Last Business" },
        { key: "vacant_on_12_31", label: "Vacant" },
        { key: "nbhd", label: "Neighborhood" },
        { key: "borough_1", label: "Borough" },
      ],
    },
  },
  {
    id: "nycha",
    name: "NYCHA Developments",
    theme: "buildings",
    icon: "Buildings",
    description: "NYC Housing Authority public housing developments.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "phvi-damg", limit: 1000 }],
    paint: { color: "#9333ea", opacity: 0.25 },
    popup: {
      title: "developmen",
      fields: [{ key: "borough", label: "Borough" }],
    },
  },
  {
    id: "dob-permits",
    name: "Construction Permits",
    theme: "buildings",
    icon: "Buildings",
    description: "DOB approved building permits with location and cost.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "ipu4-2q9a", limit: 10000 }],
    paint: { color: "#d946ef", radius: 2, haloColor: "#1f0a24" },
    popup: {
      title: "{house__} {street_name}",
      fields: [
        { key: "permit_type", label: "Permit Type" },
        { key: "job_type", label: "Job Type" },
        { key: "permit_status", label: "Status" },
        { key: "issuance_date", label: "Issued" },
        { key: "owner_s_business_name", label: "Owner" },
        { key: "borough", label: "Borough" },
      ],
    },
  },

  // ───────── Civic & Boundaries ─────────
  {
    id: "boroughs",
    name: "Boroughs",
    theme: "civic",
    icon: "MapTrifold",
    description: "The five borough boundaries.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "gthc-hcne", limit: 10 }],
    paint: { color: "#f472b6", opacity: 0.06 },
    popup: {
      title: "boroname",
      fields: [{ key: "borocode", label: "Borough Code" }],
    },
  },
  {
    id: "neighborhoods",
    name: "Neighborhoods",
    theme: "civic",
    icon: "MapPinArea",
    description: "Neighborhood Tabulation Areas (NTAs).",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "9nt8-h7nd", limit: 500 }],
    paint: { color: "#fbcfe8", opacity: 0.06 },
    popup: {
      title: "ntaname",
      fields: [
        { key: "boroname", label: "Borough" },
        { key: "cdtaname", label: "Community District" },
      ],
    },
  },
  {
    id: "community-boards",
    name: "Community Boards",
    theme: "civic",
    icon: "Bank",
    description: "NYC community board offices.",
    kind: "points",
    datasets: [{ protocol: "socrata", domain: NYC, id: "ruf7-3wgc", limit: 100 }],
    paint: { color: "#fda4af", radius: 4, haloColor: "#3f0a1a" },
    popup: {
      title: "community_board",
      fields: [
        { key: "neighborhoods", label: "Neighborhoods" },
        { key: "cb_chair", label: "Chair" },
        { key: "cb_district_manager", label: "District Manager" },
        { key: "cb_office_phone", label: "Phone" },
        { key: "cb_office_email", label: "Email" },
      ],
    },
  },
  {
    id: "bids",
    name: "Business Improvement Districts",
    theme: "civic",
    icon: "Storefront",
    description: "BIDs: geographically defined business improvement districts.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "7jdm-inj8", limit: 200 }],
    paint: { color: "#c026d3", opacity: 0.18 },
    popup: {
      title: "f_all_bi_2",
      fields: [
        { key: "f_all_bi_1", label: "Borough" },
        { key: "year_found", label: "Founded" },
      ],
    },
  },

  // ────���──── Health ─────────
  {
    id: "restaurants",
    name: "Restaurant Inspections",
    theme: "health",
    icon: "ForkKnife",
    description: "Most recent NYC restaurant inspection locations.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "43nn-pn8j", limit: 20000 }],
    paint: { color: "#fb923c", radius: 2, haloColor: "#241201" },
    popup: {
      title: "dba",
      fields: [
        { key: "cuisine_description", label: "Cuisine" },
        { key: "grade", label: "Grade" },
        { key: "score", label: "Score" },
        { key: "inspection_date", label: "Inspected" },
        { key: "violation_description", label: "Last Violation" },
      ],
    },
  },

  // ───────── Education ─────────
  {
    id: "schools",
    name: "Public Schools",
    theme: "education",
    icon: "GraduationCap",
    description: "NYC DOE public school point locations.",
    kind: "points",
    datasets: [{ protocol: "socrata", domain: NYC, id: "a3nt-yts4", limit: 5000 }],
    paint: { color: "#facc15", radius: 3, haloColor: "#241c02" },
    popup: {
      title: "loc_name",
      fields: [
        { key: "address", label: "Address" },
        { key: "city", label: "City" },
        { key: "zip", label: "ZIP" },
        { key: "loc_code", label: "Location Code" },
      ],
    },
  },
  {
    id: "libraries",
    name: "Libraries",
    theme: "education",
    icon: "Bank",
    description: "Public library locations across NYC.",
    kind: "points",
    datasets: [{ protocol: "socrata", domain: NYC, id: "feuq-due4", limit: 1000 }],
    paint: { color: "#fcd34d", radius: 3.2, haloColor: "#1f1700" },
    popup: {
      title: "name",
      fields: [
        { key: "streetname", label: "Address" },
        { key: "housenum", label: "House #" },
        { key: "city", label: "City" },
        { key: "zip", label: "ZIP" },
        { key: "system", label: "System" },
      ],
    },
  },

  // ───────── Environment & Resilience ─────────
  {
    id: "air-quality",
    name: "Air Quality Sensors",
    theme: "environment",
    icon: "Drop",
    description: "Queens air quality sensor pilot deployments.",
    kind: "points",
    datasets: [{ protocol: "socrata", domain: NYC, id: "2juy-aj8e", limit: 500 }],
    paint: { color: "#8b5cf6", radius: 4, haloColor: "#1e1140" },
    popup: {
      title: "Sensor {datasourceid}",
      fields: [
        { key: "pm2_5concmass1hourmean_value", label: "PM2.5 (1-hr mean)" },
        { key: "pm2_5concmassnowcastusepaaqi_1", label: "PM2.5 NowCast AQI" },
        { key: "startofperiod", label: "Reading Start" },
        { key: "endofperiod", label: "Reading End" },
      ],
    },
  },
  {
    id: "flood-vulnerability",
    name: "Flood Vulnerability Index",
    theme: "environment",
    icon: "Drop",
    description: "NYC's Flood Vulnerability Index (FVI) by area.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "mrjc-v9pm", limit: 5000 }],
    paint: { color: "#3b82f6", opacity: 0.18 },
    popup: {
      title: "Tract {geoid}",
      fields: [
        { key: "fshri", label: "Susceptibility & Recovery" },
        { key: "ss_cur", label: "Storm Surge (Current)" },
        { key: "ss_50s", label: "Storm Surge (2050s)" },
      ],
    },
  },
  {
    id: "hurricane-evac",
    name: "Hurricane Evacuation Zones",
    theme: "environment",
    icon: "Drop",
    description: "OEM hurricane evacuation zones.",
    kind: "polygons",
    datasets: [{ protocol: "socrata", domain: NYC, id: "epne-qv9x", limit: 2000 }],
    paint: { color: "#f97316", opacity: 0.18 },
    popup: {
      title: "Hurricane Zone {hurricane_}",
    },
  },

  // ────────��� Commerce & Civic Tech ─────────
  {
    id: "wifi",
    name: "Public Wifi & LinkNYC",
    theme: "commerce",
    icon: "WifiHigh",
    description: "Every free public wifi access point.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "yjub-udmw", limit: 10000 }],
    paint: { color: "#67e8f9", radius: 2.5, haloColor: "#062e36" },
    popup: {
      title: "name",
      fields: [
        { key: "provider", label: "Provider" },
        { key: "type", label: "Type" },
        { key: "ssid", label: "SSID" },
        { key: "location", label: "Location" },
        { key: "boroname", label: "Borough" },
      ],
    },
  },
  {
    id: "linknyc",
    name: "LinkNYC Kiosks",
    theme: "commerce",
    icon: "WifiHigh",
    description: "LinkNYC kiosk live status.",
    kind: "points",
    cluster: true,
    datasets: [{ protocol: "socrata", domain: NYC, id: "s4kf-3yrf", limit: 5000 }],
    paint: { color: "#06b6d4", radius: 2.5, haloColor: "#062436" },
    popup: {
      title: "street_address",
      fields: [
        { key: "link_type", label: "Kiosk Type" },
        { key: "status", label: "Status" },
        { key: "borough", label: "Borough" },
        { key: "community_board", label: "Community Board" },
        { key: "council_district", label: "Council District" },
      ],
    },
  },
];

export const CATEGORIES_BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));
