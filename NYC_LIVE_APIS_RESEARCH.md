# NYC Live APIs Research

> Research conducted on 2026-05-02 for the Block Maps project (maps.nyc.network)

---

## Transit & Mobility

### 1. MTA GTFS-Realtime *(already integrated)*

- **What**: Real-time subway, bus, LIRR, Metro-North vehicle positions & trip updates
- **Protocol**: GTFS-RT (protobuf)
- **Endpoint**: `https://api.mta.info/`
- **Refresh**: ~30 seconds
- **Auth**: Free API key
- **Links**:
  - [MTA Developer Resources](https://api.mta.info/)
  - [MTA Developers](https://www.mta.info/developers)

### 2. NYC Ferry GTFS-Realtime

- **What**: Real-time ferry positions, trip updates, and service alerts
- **Protocol**: GTFS-RT (protobuf)
- **Endpoints**:
  - Alerts: `https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/alert`
  - Trip Updates: `https://nycferry.connexionz.net/rtt/public/utility/gtfsrealtime.aspx/tripupdate`
  - Static GTFS: `https://nycferry.connexionz.net/rtt/public/utility/gtfs.aspx`
- **Auth**: None (public)
- **Links**:
  - [NYC Ferry Developer Tools](https://www.ferry.nyc/developer-tools/)
  - [Transitland Feed](https://www.transit.land/feeds/f-nycferry~rt)

### 3. Citi Bike GBFS *(already integrated)*

- **What**: Station locations, bike/dock availability
- **Protocol**: GBFS (JSON)
- **Refresh**: ~60 seconds
- **Links**:
  - [Citi Bike System Data](https://citibikenyc.com/system-data)

### 4. E-Scooter Operators (Bird, Lime, Veo)

- **What**: Live scooter availability in East Bronx & Eastern Queens
- **Protocol**: GBFS (JSON)
- **Auth**: Lime has public GBFS terms; Bird/Veo similar
- **Coverage**: Currently limited to East Bronx and Eastern Queens; Lime also covers parts of Manhattan, Brooklyn, and Queens
- **Links**:
  - [Lime GBFS Terms](https://www.li.me/legal/public-gbfs-terms)
  - [NYC DOT Scooter Program](https://nycdotscootershare.info/)

---

## Traffic & Parking

### 5. NYC DOT Real-Time Traffic Speeds

- **What**: Sensor-based traffic speeds on major arterials and highways
- **Protocol**: JSON/CSV via Socrata or direct feed
- **Source**: NYC TMC system sensors across five boroughs
- **Refresh**: Near real-time
- **Links**:
  - [NYC DOT Data Feeds](https://www.nyc.gov/html/dot/html/about/datafeeds.shtml)

### 6. NYC DOT Traffic Cameras

- **What**: Live video feeds from DOT cameras across all boroughs
- **Protocol**: Video stream URLs
- **Auth**: Requires data-sharing agreement (contact `tmcdot@dot.nyc.gov`)
- **Links**:
  - [NYC DOT Traffic Cameras](https://www.nyc.gov/html/dot/html/motorist/atis.shtml)

### 7. 511NY API

- **What**: Traffic speeds, incidents, roadwork, and camera data for all NY State
- **Protocol**: REST API (JSON/XML)
- **Endpoints**:
  - Cameras: `https://511ny.org/api/getcameras?key={key}&format={format}`
  - Events/Incidents: `https://511ny.org/api/getevents?key={key}&format={format}`
- **Auth**: Free API key
- **Links**:
  - [511NY Developer Resources](https://511ny.org/developers/resources)
  - [511NY API Docs](https://511ny.org/developers/help)

### 8. Parking Meters Locations & Status

- **What**: All parking meter locations, rates, and operational status
- **Protocol**: Socrata API (JSON)
- **Dataset ID**: `693u-uax6`
- **Links**:
  - [Parking Meters Locations and Status](https://data.cityofnewyork.us/Transportation/Parking-Meters-Locations-and-Status/693u-uax6)
  - [ParkNYC Block Faces](https://data.cityofnewyork.us/Transportation/Parking-Meters-ParkNYC-Blockfaces/s7zi-dgdx)

---

## Public Safety & 311

### 9. NYC 311 Service Requests

- **What**: ~500 complaint types — noise, potholes, graffiti, illegal parking, rodents, etc. with lat/lng
- **Protocol**: Socrata SODA API (JSON/GeoJSON)
- **Dataset IDs**:
  - `erm2-nwe9` — 311 Service Requests from 2020 to Present
  - `fhrw-4uyv` — All service requests
- **Refresh**: Daily auto-update
- **Auth**: Free (app token recommended for higher rate limits)
- **Example Query**: `https://data.cityofnewyork.us/resource/erm2-nwe9.json?$where=created_date > '2026-05-01'&$limit=1000`
- **Links**:
  - [311 Service Requests (2020–Present)](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2020-to-Present/erm2-nwe9)
  - [NYC311 Portal](https://portal.311.nyc.gov/)

### 10. NYPD Crime / Complaint Data

- **What**: Incident-level arrests, shootings, complaints with precinct/geo data
- **Protocol**: Socrata SODA API (JSON)
- **Refresh**: Quarterly updates (current year data)
- **Datasets**:
  - Crime Map: `qb7u-rbmr`
  - Shooting Incidents: `833y-fsy8`
  - Arrests: `8h9b-rp9u`
- **Links**:
  - [NYC Crime Data](https://data.cityofnewyork.us/Public-Safety/NYC-crime/qb7u-rbmr)
  - [NYPD Crime Statistics](https://www.nyc.gov/site/nypd/stats/crime-statistics/citywide-crime-stats.page)

### 11. FDNY / EMS Incident Dispatch Data

- **What**: EMS & fire incident dispatch records (aggregated location for HIPAA compliance)
- **Protocol**: Socrata SODA API (JSON)
- **Dataset IDs**:
  - `76xm-jjuj` — EMS Incident Dispatch
  - `8m42-w767` — Fire Incident Dispatch
- **Note**: Historical data, not true real-time dispatch. Locations are coarsened for privacy.
- **Links**:
  - [EMS Incidents](https://data.cityofnewyork.us/Public-Safety/EMS-Incident-Dispatch-Data/76xm-jjuj)
  - [Fire Incidents](https://data.cityofnewyork.us/Public-Safety/Fire-Incident-Dispatch-Data/8m42-w767)

---

## Environment & Resilience

### 12. NYC Real-Time Air Quality

- **What**: Hourly PM2.5 from Community Air Survey street-level monitors + 11 DEC rooftop stations
- **Protocol**: JSON / CSV (downloadable by month)
- **Source**: TSI DustTrak sensors + NY State DEC rooftop monitors
- **Refresh**: Hourly
- **Links**:
  - [NYC Real-Time Air Quality](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-features/realtime-air-quality/)
  - [NYC Air Quality Data Explorer](https://a816-dohbesp.nyc.gov/IndicatorPublic/data-explorer/air-quality/)

### 13. AirNow / EPA AQS API

- **What**: AQI, PM2.5, ozone for all NYC monitoring stations
- **Protocol**: REST API (JSON)
- **Auth**: Free API key
- **Links**:
  - [AirNow](https://www.airnow.gov/)
  - [AirNow API](https://docs.airnowapi.org/)

### 14. Combined Sewer Overflow (CSO) Monitoring

- **What**: Real-time CSO discharge detection at outfall locations across NYC waterways
- **Protocol**: Map data via NY State Open Data
- **Dataset**: CSO outfall locations with overflow frequency
- **Note**: DEP has pilot real-time sensors at 5 outfalls; community alert system exists for overflow events
- **Context**: ~60% of NYC uses combined sewers; 398 CSO outfalls discharge ~18 billion gallons annually
- **Links**:
  - [CSO Map Data](https://data.ny.gov/Energy-Environment/Combined-Sewer-Overflows-CSOs-Map/i8hd-rmbi/data)
  - [NYC DEP – Combined Sewer Overflows](https://www.nyc.gov/site/dep/water/combined-sewer-overflows.page)

### 15. FEMA Flood Hazard Layer *(already integrated)*

- **What**: Flood zones, base flood elevations
- **Protocol**: ArcGIS REST (GeoJSON)

---

## Infrastructure & Civic

### 16. DOB NOW Construction Permits

- **What**: Approved building permits with location, cost, owner, type
- **Protocol**: Socrata SODA API (JSON)
- **Dataset ID**: `rbx6-tga4`
- **Refresh**: ~24 hour lag
- **Links**:
  - [DOB NOW Permits](https://data.cityofnewyork.us/Housing-Development/DOB-NOW-Build-Approved-Permits/rbx6-tga4)
  - [DOB Permit Issuance](https://data.cityofnewyork.us/Housing-Development/DOB-Permit-Issuance/ipu4-2q9a)

### 17. LinkNYC Kiosk Locations & Status

- **What**: All LinkNYC / Link5G kiosk locations + wifi/tablet/phone operational status
- **Protocol**: Socrata SODA API (JSON)
- **Dataset IDs**:
  - `s4kf-3yrf` — Kiosk Locations
  - `n6c5-95xh` — Kiosk Status (wifi, tablet, phone operational state)
- **Links**:
  - [LinkNYC Locations](https://data.cityofnewyork.us/Social-Services/LinkNYC-Kiosk-Locations/s4kf-3yrf)
  - [LinkNYC Status](https://data.cityofnewyork.us/widgets/n6c5-95xh)

---

## Priority Matrix for Block Maps Integration

| Priority | API | Protocol | Fits Theme | Rationale |
|----------|-----|----------|------------|-----------|
| **P0** | NYC Ferry GTFS-RT | GTFS-RT | Transit | Same protocol already handled; fills ferry gap |
| **P0** | 311 Service Requests | Socrata | Civic | Massive geo-coded dataset; daily refresh; existing Socrata fetcher works |
| **P1** | Real-Time Air Quality | JSON | Resilience | Hourly sensor data; strong fit for Resilience theme |
| **P1** | 511NY Traffic | REST JSON | Transit | Incidents + speeds; free API key |
| **P1** | E-Scooters (GBFS) | GBFS | Transit | Same protocol as Citi Bike; extends mobility coverage |
| **P2** | DOB Permits | Socrata | Buildings | Construction activity heatmap; fits Buildings theme |
| **P2** | LinkNYC Kiosks | Socrata | Civic | Civic infrastructure layer |
| **P2** | Parking Meters | Socrata | Transit | Useful for drivers; new "Parking" category |
| **P2** | NYPD Crime Data | Socrata | Civic | Public safety overlay; quarterly updates |
| **P3** | Traffic Cameras | Video URLs | Transit | Requires data-sharing agreement with DOT |
| **P3** | CSO Monitoring | NY Open Data | Resilience | Pilot stage; limited real-time coverage |
| **P3** | FDNY/EMS Dispatch | Socrata | Civic | Historical only; coarsened locations |

---

## Notes

- **Socrata SODA API base**: `https://data.cityofnewyork.us/resource/{dataset_id}.json`
- **Rate limits**: Unauthenticated requests are throttled. Register for a free app token at [NYC Open Data](https://data.cityofnewyork.us/) for higher limits.
- **Geo filtering**: Most Socrata datasets support `$where=within_circle(location, lat, lng, radius)` for spatial queries.
- **GTFS-RT**: Requires protobuf parsing. The project already has this capability via the MTA integration.
- **GBFS**: Standard JSON spec. The project already parses this for Citi Bike.
