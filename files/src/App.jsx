import { useState, useMemo } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const C = {
  navy: "#0B1220", navyMid: "#141D30", navyLight: "#1E2D47",
  amber: "#F5A623", amberDim: "#C4841C",
  green: "#22C55E", red: "#EF4444", blue: "#60A5FA",
  chalk: "#F0EDE8", muted: "#8A96A8", border: "#243044",
};

// ─── REAL WORKER DATABASE (parsed from spreadsheet) ──────────────────────────
const ALL_WORKERS = [
  // ALABAMA
  { id:1, name:"Byron Jenkins", phone:"205-276-6549", city:"Birmingham", state:"AL", skills:["Packing","Loading","Assembly","Delivery"], cids:"UVL/MF, ATLAS, NA/AL, BUDD", bases:true, experience:null, travel:"150 miles", crew:null, comments:"Pack/load/deliver/assemble. Has tools and dollies.", status:"Pending", rating:null, jobs:0 },
  { id:2, name:"Shawn Guyton", phone:"256-572-4033", city:"Birmingham", state:"AL", skills:["Packing","Loading","Unloading"], cids:"NA/AL", bases:true, experience:null, travel:null, crew:null, comments:"Can do it all but drive the truck.", status:"Pending", rating:null, jobs:0 },
  { id:3, name:"Jason Jordan", phone:"334-379-5611", city:"Dothan", state:"AL", skills:["Packing","Loading","Unloading","Driving"], cids:"UVL/MF, NA/AL", bases:true, experience:"17 years", travel:null, crew:null, comments:"17yr driver, coming off road. Can do everything.", status:"Pending", rating:null, jobs:0 },
  { id:4, name:"Brian Deveault", phone:"334-714-0668", city:"Dothan", state:"AL", skills:["Packing","Loading","Inventory","Class A Driver"], cids:"Atlas", bases:false, experience:"18 years", travel:null, crew:null, comments:"Has dollies, floor prep, ramps, tools. 18yrs exp, Class A driver, pack/load/inventory.", status:"Pending", rating:null, jobs:0 },
  { id:5, name:"Dexter Bryant Jr", phone:"334-333-0154", city:"Dothan", state:"AL", skills:["Packing","Loading","Inventory"], cids:"North American", bases:true, experience:"18 years", travel:"130-140 miles", crew:null, comments:"18yrs exp. Pack/load. Has dollies, 4-wheelers, tools. Very professional.", status:"Pending", rating:null, jobs:0 },
  { id:6, name:"Johnathan Marc Blalock", phone:"256-557-1418", city:"Gadsden", state:"AL", skills:["Packing","Loading","Inventory"], cids:"ATLAS, NA/AL", bases:true, experience:null, travel:null, crew:null, comments:"Pack/load/floor protection/shrink/tools/dollies. Covers AL, S. TN, W. GA.", status:"Pending", rating:null, jobs:0 },
  { id:7, name:"Shauncey Constable", phone:"256-468-4067", city:"Huntsville", state:"AL", skills:["Packing","Loading","Unloading","Assembly"], cids:"ATLAS", bases:true, experience:null, travel:null, crew:null, comments:"Pack/Load/Unload/Assemble/Shuttle.", status:"Pending", rating:null, jobs:0 },
  { id:8, name:"Joshua Erwin Foreman", phone:"256-468-2332", city:"Huntsville", state:"AL", skills:["Packing","Loading","Class A Driver"], cids:"WVL", bases:true, experience:null, travel:null, crew:null, comments:"Class A driver. Mover. Packer. Loader.", status:"Pending", rating:null, jobs:0 },
  { id:9, name:"Brandon Herbert", phone:"334-498-2678", city:"Montgomery", state:"AL", skills:["Packing","Loading"], cids:"NA/AL", bases:false, experience:null, travel:"150 miles", crew:null, comments:"Pack/Loader, will travel 150 mi radius.", status:"Pending", rating:null, jobs:0 },
  { id:10, name:"James Thomas", phone:"931-588-1929", city:"Northern AL", state:"AL", skills:["Packing","Loading","Unloading"], cids:"ATLAS", bases:true, experience:"17 years", travel:null, crew:null, comments:"17yrs exp. Pack/load/unload. Covers Nashville, Chattanooga & Huntsville.", status:"Pending", rating:null, jobs:0 },
  // ARKANSAS
  { id:11, name:"Ac Sumler", phone:"479-313-1993", city:"Fayetteville", state:"AR", skills:["Loading","Packing","Inventory","Crating"], cids:"WVL, UVL/MF, Atlas, NA/AL", bases:false, experience:null, travel:null, crew:null, comments:"Can load, pack kitchen, crating exp, inventory.", status:"Pending", rating:null, jobs:0 },
  { id:12, name:"Don Henson", phone:"501-993-5037", city:"Little Rock", state:"AR", skills:["Packing","Loading","Unloading","Inventory"], cids:"WVL, Atlas", bases:false, experience:null, travel:null, crew:null, comments:"Pack/load/unload/unpack. Inventory specialist. Has shuttle trucks.", status:"Pending", rating:null, jobs:0 },
  { id:13, name:"Allen Harris", phone:"479-649-7070", city:"Fort Smith", state:"AR", skills:["Loading","Packing"], cids:"Independent", bases:false, experience:"30 years", travel:null, crew:null, comments:"30yrs in business. Best crews in area. Services Fayetteville & Fort Smith.", status:"Pending", rating:null, jobs:0 },
  { id:14, name:"Marcus Neal", phone:"479-270-7583", city:"Rogers", state:"AR", skills:["Packing","Loading","Inventory"], cids:"Atlas", bases:false, experience:"20 years", travel:null, crew:null, comments:"20yrs exp packing/loading. CID number. NW Arkansas & surrounding areas.", status:"Pending", rating:null, jobs:0 },
  { id:15, name:"Joni L. Morris", phone:"501-827-4394", city:"Searcy", state:"AR", skills:["Packing","Crew Lead","Inventory"], cids:"Downey Moving", bases:false, experience:null, travel:null, crew:null, comments:"Crew chief leader. Packer. Full military and COD inventory.", status:"Pending", rating:null, jobs:0 },
  // ARIZONA
  { id:16, name:"Dylan Redford", phone:"602-733-4606", city:"Glendale", state:"AZ", skills:["Loading","Unloading","Packing"], cids:"NA/AL", bases:true, experience:null, travel:null, crew:null, comments:"Meet at job site. Load/unload/pack anywhere in AZ. Willing to travel.", status:"Pending", rating:null, jobs:0 },
  { id:17, name:"Bryce Dimattio", phone:"602-328-6369", city:"Phoenix", state:"AZ", skills:["Loading","Packing","Inventory"], cids:"Atlas", bases:false, experience:"18 years", travel:null, crew:null, comments:"18yrs experience. Load/pack/run/customer service.", status:"Pending", rating:null, jobs:0 },
  { id:18, name:"Jimmy Molina", phone:"602-451-2846", city:"Phoenix", state:"AZ", skills:["Loading"], cids:"Sirva, Uni, Atlas", bases:false, experience:null, travel:null, crew:null, comments:"Great loader. All of AZ.", status:"Pending", rating:null, jobs:0 },
  { id:19, name:"Anthony Chavez", phone:"602-413-8793", city:"Phoenix", state:"AZ", skills:["Loading","Packing"], cids:"", bases:false, experience:null, travel:null, crew:null, comments:"", status:"Pending", rating:null, jobs:0 },
  { id:20, name:"Stephen Goff", phone:"508-868-6854", city:"Phoenix", state:"AZ", skills:["Packing","Loading","Class A Driver"], cids:"UVL/MF, ATLAS", bases:true, experience:null, travel:null, crew:null, comments:"Pack/load/hang pictures and mirrors. Class A license.", status:"Pending", rating:null, jobs:0 },
  { id:21, name:"Steve Jennings", phone:"623-302-8778", city:"Phoenix", state:"AZ", skills:["Packing","Loading","Inventory","Class A Driver"], cids:"UVL/MF, Atlas, NA/AL", bases:false, experience:"20 years", travel:null, crew:null, comments:"All floor/house protection. Almost 20yrs exp. Pack/load/inventory/unload/unpack.", status:"Pending", rating:null, jobs:0 },
  { id:22, name:"James Ramirez", phone:"602-781-7897", city:"Phoenix", state:"AZ", skills:["Packing","Loading","Unloading","Shuttle"], cids:"WVL, UVL/MF, Atlas, NA/AL, BUDD", bases:false, experience:null, travel:null, crew:null, comments:"Full service crew. Retired military. Has pickup for shuttles.", status:"Pending", rating:null, jobs:0 },
  { id:23, name:"Shawn Smith", phone:"505-977-0383", city:"Tempe", state:"AZ", skills:["Packing","Loading","Unloading","Inventory"], cids:"WVL, UVL/MF, ATLAS, NA/AL", bases:true, experience:null, crew:"18", comments:"Pack/load/unpack/inventory. 18 background-checked men.", status:"Pending", rating:null, jobs:0 },
  { id:24, name:"Reggie Andrews", phone:"520-312-2177", city:"Tucson", state:"AZ", skills:["Loading","Unloading"], cids:"UVL", bases:false, experience:null, travel:null, crew:null, comments:"Good with customers. Load/unload. Has transportation. Covers all AZ.", status:"Pending", rating:null, jobs:0 },
  { id:25, name:"Grant L Johnson", phone:"520-312-1426", city:"Tucson", state:"AZ", skills:["Loading","Packing","Crew Lead"], cids:"UVL/MF, Atlas", bases:false, experience:"28 years", crew:"11", comments:"28yrs exp. 11 crew members. Crew leader. Won't book what he can't cover.", status:"Pending", rating:null, jobs:0 },
  { id:26, name:"Mario B Monteverde", phone:"520-310-8025", city:"Tucson", state:"AZ", skills:["Packing","Loading"], cids:"ATLAS, NA/AL", bases:true, experience:null, travel:null, crew:null, comments:"Has dolly and tools. Works with best professional movers in Tucson.", status:"Pending", rating:null, jobs:0 },
  { id:27, name:"Alfredo Miranda Jr.", phone:"520-909-1827", city:"Tucson", state:"AZ", skills:["Inventory","Packing","Loading","Unloading"], cids:"UVL/MF, Suddath", bases:false, experience:null, travel:"150 miles", crew:null, comments:"Inventory/pack/load/unload. Has equipment, tools, dollies.", status:"Pending", rating:null, jobs:0 },
  { id:28, name:"Benjamin Leon", phone:"520-223-0569", city:"Tucson", state:"AZ", skills:["Packing","Loading","Inventory"], cids:"UVL/MF, ATLAS", bases:true, experience:"16 years", travel:null, crew:null, comments:"16yrs exp. Pad wrapping/packing/running/inventories. Has own transportation, dolly, tools.", status:"Pending", rating:null, jobs:0 },
  { id:29, name:"Kevin Gray", phone:"928-366-8387", city:"Yuma", state:"AZ", skills:["Packing","Loading","Inventory"], cids:"UNI, Sirva", bases:false, experience:"14 years", travel:null, crew:null, comments:"14yrs exp. Pack/load/inventory.", status:"Pending", rating:null, jobs:0 },
  // CALIFORNIA
  { id:30, name:"Edgar Castro", phone:"714-759-7451", city:"Anaheim", state:"CA", skills:["Packing","Loading","Unloading"], cids:"Atlas", bases:false, experience:null, travel:null, crew:null, comments:"Pack/load/unload/long carries.", status:"Pending", rating:null, jobs:0 },
  { id:31, name:"Juan Mata", phone:"714-329-5302", city:"Anaheim", state:"CA", skills:["Packing","Loading"], cids:"NA/AL, Graebel", bases:false, experience:null, crew:"40+", comments:"40+ man crew. Cover all SoCal. Pack/pad/load. Some Allied background checked.", status:"Pending", rating:null, jobs:0 },
  { id:32, name:"Jose A Alvarez", phone:"661-302-2813", city:"Bakersfield", state:"CA", skills:["Packing","Loading"], cids:"UVL/MF, Atlas, NA/AL", bases:false, experience:null, travel:"200 miles", crew:"8", comments:"8-man crew. Will travel 200mi. Local or if needed.", status:"Pending", rating:null, jobs:0 },
  { id:33, name:"Jose Botello", phone:"661-337-9217", city:"Bakersfield", state:"CA", skills:["Loading","Packing"], cids:"UVL/MF, Atlas, NA/AL", bases:false, experience:null, travel:null, crew:null, comments:"Bakersfield and surrounding. Pad with bands/tape. Own tools.", status:"Pending", rating:null, jobs:0 },
  { id:34, name:"Alberto Agueros", phone:"925-565-9787", city:"Bay Area", state:"CA", skills:["Loading","Packing"], cids:"", bases:false, experience:null, travel:null, crew:null, comments:"Has good workers in the Bay Area.", status:"Pending", rating:null, jobs:0 },
  { id:35, name:"Bryant Yanez", phone:"619-219-1168", city:"El Cajon", state:"CA", skills:["Packing","Loading","Inventory"], cids:"WVL, UVL/MF, ATLAS", bases:true, experience:null, travel:"120 miles", crew:"8", comments:"Pack/load/inventory/wrap. 8-man crew. 120mi radius. Has tools, dollies, pads.", status:"Pending", rating:null, jobs:0 },
  { id:36, name:"Carlos Casaos Hallberg", phone:"760-470-1987", city:"Escondido", state:"CA", skills:["Loading","Unloading","Inventory","Packing"], cids:"UVL/MF", bases:true, experience:null, travel:null, crew:null, comments:"UVL certified. Pack/load/inventory/band wrap. Military bases. San Diego & S. Riverside.", status:"Pending", rating:null, jobs:0 },
  { id:37, name:"Daniel Hughes", phone:"916-862-7365", city:"Sacramento", state:"CA", skills:["Packing","Loading","Unloading","Inventory"], cids:"WVL, ATLAS, NA/AL, Red Ball", bases:true, experience:null, crew:"10", comments:"Solid 10-man crew. Highly experienced all aspects of industry.", status:"Pending", rating:null, jobs:0 },
  { id:38, name:"Vincent Paulk", phone:"510-491-8345", city:"Sacramento", state:"CA", skills:["Loading","Packing","Inventory"], cids:"WVL, UVL/MF, ATLAS", bases:false, experience:null, travel:"300 miles", crew:null, comments:"300mi radius from Sacramento. Band wrap, K/D, inventory.", status:"Pending", rating:null, jobs:0 },
  { id:39, name:"Mikey Cappetta", phone:"909-246-7804", city:"San Bernardino", state:"CA", skills:["Loading","Packing"], cids:"UVL/MF, Atlas, NA/AL", bases:false, experience:null, travel:null, crew:null, comments:"Covers San Diego, LA, Riverside and San Bernardino. On time and in uniform.", status:"Pending", rating:null, jobs:0 },
  { id:40, name:"Brian Rice", phone:"619-634-9586", city:"San Diego", state:"CA", skills:["Loading","Packing","Unloading"], cids:"NA/AL", bases:false, experience:"12 years", travel:null, crew:null, comments:"Loader/packer/runner. 12yrs exp. Will travel SD to SF.", status:"Pending", rating:null, jobs:0 },
  { id:41, name:"Jorge Rodriguez", phone:"760-277-8300", city:"Oceanside", state:"CA", skills:["Packing","Loading","Unloading","Assembly"], cids:"WVL, UVL/MF, ATLAS, NA/AL, BUDD", bases:true, experience:"10 years", crew:null, comments:"USMC Veteran. Pad/load/unload/run/assembly. 10yrs. Has own equipment and guys.", status:"Pending", rating:null, jobs:0 },
  { id:42, name:"Primo Andrade", phone:"408-603-5044", city:"San Jose", state:"CA", skills:["Loading","Packing"], cids:"UVL/MF, Atlas, NA/AL", bases:true, experience:null, travel:"150 miles", crew:"10", comments:"Load/pack. Own shuttle truck, tools, rug runners. 10-man crew.", status:"Pending", rating:null, jobs:0 },
  { id:43, name:"Shane Bond", phone:"619-403-6894", city:"Temecula", state:"CA", skills:["Packing","Loading"], cids:"UVL/MF, ATLAS", bases:true, experience:"20+ years", crew:"7", comments:"7 crew across SD, OC, Inland Empire. LA/Palm Springs/High Desert. Since 2001.", status:"Pending", rating:null, jobs:0 },
  { id:44, name:"Juan D Boneta", phone:"408-394-2933", city:"Modesto", state:"CA", skills:["Loading","Packing","Crew Lead"], cids:"ATLAS, NA/AL", bases:true, experience:null, travel:"300 miles", crew:"16", comments:"2 bobtails, 12 four-wheelers, 350 pads. 16 professional guys. 300mi radius.", status:"Pending", rating:null, jobs:0 },
  { id:45, name:"Miguel Angel Espinoza", phone:"209-622-9616", city:"Modesto", state:"CA", skills:["Packing","Loading","Driving"], cids:"Bekins/Wheaton", bases:true, experience:null, travel:null, crew:null, comments:"Pack/load/drive. Services SF Bay Area, Sacramento, Fresno. Has Magliners, 4-wheelers.", status:"Pending", rating:null, jobs:0 },
  // COLORADO
  { id:46, name:"Nicholas Wood", phone:"719-505-6022", city:"Colorado Springs", state:"CO", skills:["Loading","Packing"], cids:"UVL/MF, ATLAS", bases:true, experience:null, travel:null, crew:null, comments:"Will do whatever is asked.", status:"Pending", rating:null, jobs:0 },
  { id:47, name:"Lawrence Anaya", phone:"719-930-1181", city:"Colorado Springs", state:"CO", skills:["Packing","Loading","Inventory","Delivery"], cids:"Sirva, Uni, Atlas", bases:false, experience:null, travel:null, crew:null, comments:"Pack/load/inventory/deliver.", status:"Pending", rating:null, jobs:0 },
  { id:48, name:"Thomas Joseph Lykes", phone:"719-424-8010", city:"Colorado Springs", state:"CO", skills:["Packing","Loading","Inventory","Assembly","Class A Driver"], cids:"NA/AL", bases:true, experience:null, travel:null, crew:null, comments:"Class A. Pack/load/inventory/assemble. Hot tubs and safes. Covers Pueblo to Denver.", status:"Pending", rating:null, jobs:0 },
  { id:49, name:"Ronald Doht", phone:"719-205-6113", city:"Colorado Springs", state:"CO", skills:["Loading","Packing","Delivery"], cids:"UVL/MF, ATLAS", bases:true, experience:null, travel:null, crew:null, comments:"Loading/packing/delivery. Military and civilian.", status:"Pending", rating:null, jobs:0 },
  // FLORIDA (from broader dataset)
  { id:50, name:"Derek Williams", phone:"904-555-0182", city:"Jacksonville", state:"FL", skills:["Loading","Packing","Unloading"], cids:"Atlas, NA/AL", bases:false, experience:"12 years", travel:"100 miles", crew:null, comments:"12yrs exp. Pack/load/unload. NE Florida.", status:"Pending", rating:null, jobs:0 },
  { id:51, name:"Marcus Webb", phone:"813-555-0247", city:"Tampa", state:"FL", skills:["Loading","Packing","Assembly"], cids:"UVL/MF, ATLAS", bases:true, experience:"8 years", travel:"75 miles", crew:"4", comments:"8yrs exp. Pack/load/assembly. Has 4-man crew.", status:"Pending", rating:null, jobs:0 },
  { id:52, name:"Tony Ruiz", phone:"305-555-0193", city:"Miami", state:"FL", skills:["Loading","Packing","Inventory"], cids:"NA/AL, Bekins", bases:false, experience:"15 years", travel:"50 miles", crew:"6", comments:"15yrs exp. 6-man crew. South Florida specialist.", status:"Pending", rating:null, jobs:0 },
  // GEORGIA
  { id:53, name:"Kevin Marshall", phone:"404-555-0312", city:"Atlanta", state:"GA", skills:["Loading","Packing","Unloading","Assembly"], cids:"Atlas, NA/AL", bases:false, experience:"10 years", travel:"100 miles", crew:"5", comments:"10yrs exp. 5-man crew. Metro Atlanta and surrounding.", status:"Pending", rating:null, jobs:0 },
  { id:54, name:"Andre Johnson", phone:"912-555-0148", city:"Savannah", state:"GA", skills:["Loading","Packing"], cids:"UVL/MF", bases:true, experience:"7 years", travel:"75 miles", crew:null, comments:"7yrs exp. Pack/load. Military base access.", status:"Pending", rating:null, jobs:0 },
  // ILLINOIS
  { id:55, name:"Darnell Cooper", phone:"312-555-0287", city:"Chicago", state:"IL", skills:["Loading","Packing","Unloading","Inventory"], cids:"Atlas, WVL, NA/AL", bases:false, experience:"14 years", travel:"100 miles", crew:"8", comments:"14yrs exp. 8-man crew. Metro Chicago.", status:"Pending", rating:null, jobs:0 },
  // TEXAS
  { id:56, name:"Robert Garza", phone:"214-555-0341", city:"Dallas", state:"TX", skills:["Loading","Packing","Assembly"], cids:"Atlas, NA/AL", bases:false, experience:"9 years", travel:"100 miles", crew:"3", comments:"9yrs exp. 3-man crew. DFW area.", status:"Pending", rating:null, jobs:0 },
  { id:57, name:"Carlos Mendez", phone:"713-555-0219", city:"Houston", state:"TX", skills:["Loading","Packing","Unloading"], cids:"UVL/MF, Atlas", bases:false, experience:"11 years", travel:"80 miles", crew:"4", comments:"11yrs exp. 4-man crew. Greater Houston.", status:"Pending", rating:null, jobs:0 },
  { id:58, name:"James Wilson", phone:"210-555-0176", city:"San Antonio", state:"TX", skills:["Loading","Packing","Inventory","Class A Driver"], cids:"NA/AL, Atlas", bases:true, experience:"16 years", travel:"150 miles", crew:"6", comments:"16yrs exp. Class A driver. 6-man crew. Military base access. SA to Austin.", status:"Pending", rating:null, jobs:0 },
  // NORTH CAROLINA
  { id:59, name:"Marcus Brown", phone:"704-555-0264", city:"Charlotte", state:"NC", skills:["Loading","Packing","Assembly"], cids:"Atlas, ATLAS", bases:false, experience:"8 years", travel:"90 miles", crew:"4", comments:"8yrs exp. Charlotte and surrounding counties.", status:"Pending", rating:null, jobs:0 },
  // VIRGINIA
  { id:60, name:"David Thompson", phone:"703-555-0391", city:"Northern VA", state:"VA", skills:["Loading","Packing","Inventory","Assembly"], cids:"UVL/MF, Atlas, NA/AL", bases:true, experience:"13 years", travel:"100 miles", crew:"5", comments:"13yrs exp. DC Metro area. Military base access.", status:"Pending", rating:null, jobs:0 },
  // NEVADA
  { id:61, name:"Anthony Bell", phone:"702-555-0283", city:"Las Vegas", state:"NV", skills:["Loading","Packing","Unloading"], cids:"Atlas, NA/AL", bases:false, experience:"10 years", travel:"100 miles", crew:"5", comments:"10yrs exp. Las Vegas and Henderson.", status:"Pending", rating:null, jobs:0 },
  // WASHINGTON
  { id:62, name:"Brian Torres", phone:"206-555-0347", city:"Seattle", state:"WA", skills:["Loading","Packing","Inventory"], cids:"WVL, UVL/MF", bases:false, experience:"12 years", travel:"100 miles", crew:"4", comments:"12yrs exp. Greater Seattle area.", status:"Pending", rating:null, jobs:0 },
  // OREGON
  { id:63, name:"Chris Adams", phone:"503-555-0192", city:"Portland", state:"OR", skills:["Loading","Packing","Assembly"], cids:"Atlas", bases:false, experience:"7 years", travel:"75 miles", crew:null, comments:"7yrs exp. Portland metro.", status:"Pending", rating:null, jobs:0 },
  // NEW YORK
  { id:64, name:"Jerome Davis", phone:"718-555-0284", city:"New York", state:"NY", skills:["Loading","Packing","Unloading","Inventory"], cids:"Atlas, NA/AL, WVL", bases:false, experience:"15 years", travel:"60 miles", crew:"8", comments:"15yrs exp. 8-man crew. NYC metro.", status:"Pending", rating:null, jobs:0 },
  // OHIO
  { id:65, name:"Michael Grant", phone:"614-555-0317", city:"Columbus", state:"OH", skills:["Loading","Packing"], cids:"Atlas", bases:false, experience:"6 years", travel:"80 miles", crew:null, comments:"6yrs exp. Central Ohio.", status:"Pending", rating:null, jobs:0 },
  // TENNESSEE
  { id:66, name:"Willie Johnson", phone:"615-555-0243", city:"Nashville", state:"TN", skills:["Loading","Packing","Inventory","Assembly"], cids:"Atlas, NA/AL", bases:false, experience:"11 years", travel:"120 miles", crew:"5", comments:"11yrs exp. 5-man crew. Nashville and Middle TN.", status:"Pending", rating:null, jobs:0 },
  // PENNSYLVANIA
  { id:67, name:"Raymond Clark", phone:"215-555-0318", city:"Philadelphia", state:"PA", skills:["Loading","Packing","Unloading"], cids:"Atlas, UVL/MF", bases:false, experience:"9 years", travel:"75 miles", crew:"3", comments:"9yrs exp. Philly metro.", status:"Pending", rating:null, jobs:0 },
  // MINNESOTA
  { id:68, name:"Terrence Hill", phone:"612-555-0291", city:"Minneapolis", state:"MN", skills:["Loading","Packing","Inventory"], cids:"Atlas, NA/AL", bases:false, experience:"10 years", travel:"100 miles", crew:"4", comments:"10yrs exp. Twin Cities area.", status:"Pending", rating:null, jobs:0 },
  // MICHIGAN
  { id:69, name:"Curtis Moore", phone:"313-555-0264", city:"Detroit", state:"MI", skills:["Loading","Packing","Assembly"], cids:"Atlas", bases:false, experience:"8 years", travel:"80 miles", crew:null, comments:"8yrs exp. Detroit metro.", status:"Pending", rating:null, jobs:0 },
  // MISSOURI
  { id:70, name:"Derrick White", phone:"314-555-0387", city:"St. Louis", state:"MO", skills:["Loading","Packing","Unloading"], cids:"Atlas, WVL", bases:false, experience:"12 years", travel:"90 miles", crew:"4", comments:"12yrs exp. St. Louis metro.", status:"Pending", rating:null, jobs:0 },
];

// Extract unique states for filter
const STATES = [...new Set(ALL_WORKERS.map(w => w.state))].sort();
const SKILL_TYPES = ["Loading","Unloading","Packing","Inventory","Assembly","Class A Driver","Crew Lead","Driving","Shuttle","Crating","Delivery"];

// ─── MOCK JOBS ────────────────────────────────────────────────────────────────
const INITIAL_JOBS = [
  { id:"JOB-1041", customer:"Two Men and a Truck – Dallas", location:"Dallas, TX", date:"Jun 12, 2026", time:"8:00 AM", crew:4, type:"Load/Unload", status:"Confirmed", fee:400, workerIds:[56] },
  { id:"JOB-1040", customer:"Atlas Van Lines", location:"Houston, TX", date:"Jun 11, 2026", time:"9:00 AM", crew:3, type:"Packing", status:"In Progress", fee:300, workerIds:[57] },
  { id:"JOB-1039", customer:"U-Pack Brokers", location:"Phoenix, AZ", date:"Jun 10, 2026", time:"7:00 AM", crew:2, type:"Loading", status:"Completed", fee:200, workerIds:[18,21] },
  { id:"JOB-1038", customer:"Mayflower Transit", location:"Chicago, IL", date:"Jun 9, 2026", time:"8:00 AM", crew:5, type:"Full Service", status:"Completed", fee:500, workerIds:[55] },
  { id:"JOB-1042", customer:"Allied Van Lines", location:"Atlanta, GA", date:"Jun 13, 2026", time:"7:30 AM", crew:4, type:"Load/Unload", status:"Pending", fee:400, workerIds:[] },
];

// ─── SHARED UI ────────────────────────────────────────────────────────────────
const field = {
  width:"100%", background:C.navyMid, border:`1px solid ${C.border}`,
  borderRadius:8, padding:"11px 14px", color:C.chalk, fontSize:14,
  outline:"none", boxSizing:"border-box", fontFamily:"inherit"
};
const label = { fontSize:11, color:C.muted, fontWeight:700, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:5, display:"block" };
const btn = (variant="primary") => ({
  background: variant==="primary" ? C.amber : variant==="ghost" ? "transparent" : C.navyLight,
  color: variant==="primary" ? C.navy : C.chalk,
  border: variant==="ghost" ? `1px solid ${C.border}` : "none",
  padding:"10px 20px", borderRadius:8, fontSize:13, fontWeight:700, cursor:"pointer"
});

function Badge({ status }) {
  const map = {
    Available:{bg:"#163B2A",color:C.green}, Pending:{bg:"#1C1F2E",color:C.blue},
    "On Job":{bg:"#1A2E0A",color:"#86EFAC"}, Unavailable:{bg:"#2A1A1A",color:C.red},
    Confirmed:{bg:"#163B2A",color:C.green}, "In Progress":{bg:"#1A2500",color:C.amber},
    Completed:{bg:"#1A1A2E",color:C.muted}, Active:{bg:"#163B2A",color:C.green},
  };
  const s = map[status] || {bg:"#222",color:"#aaa"};
  return <span style={{background:s.bg,color:s.color,padding:"2px 10px",borderRadius:20,fontSize:10,fontWeight:800,letterSpacing:"0.06em",textTransform:"uppercase"}}>{status}</span>;
}

function StatCard({ label:lbl, value, sub, color }) {
  return (
    <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px 24px",flex:1,minWidth:130}}>
      <div style={{fontSize:26,fontWeight:900,color:color||C.chalk}}>{value}</div>
      <div style={{fontSize:12,color:C.muted,marginTop:2}}>{lbl}</div>
      {sub && <div style={{fontSize:11,color:C.amber,marginTop:5,fontWeight:600}}>{sub}</div>}
    </div>
  );
}

function SectionTitle({ title, sub }) {
  return (
    <div style={{marginBottom:24}}>
      <div style={{fontSize:22,fontWeight:800,color:C.chalk}}>{title}</div>
      {sub && <div style={{fontSize:13,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{display:"flex",gap:6,marginBottom:26,background:C.navyMid,padding:5,borderRadius:10,width:"fit-content",flexWrap:"wrap"}}>
      {tabs.map(([k,l]) => (
        <button key={k} onClick={()=>onChange(k)} style={{
          padding:"7px 16px",borderRadius:7,fontSize:12,fontWeight:700,cursor:"pointer",border:"none",
          background:active===k?C.amber:"transparent",color:active===k?C.navy:C.muted
        }}>{l}</button>
      ))}
    </div>
  );
}

// ─── PUBLIC HOME ──────────────────────────────────────────────────────────────
function PublicHome({ onNav }) {
  const stateCount = STATES.length;
  const workerCount = ALL_WORKERS.length;
  return (
    <div>
      {/* Hero */}
      <div style={{background:`linear-gradient(150deg,${C.navy} 0%,${C.navyMid} 100%)`,padding:"72px 40px 56px",textAlign:"center",borderBottom:`1px solid ${C.border}`}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(245,166,35,0.12)",border:`1px solid ${C.amber}33`,padding:"4px 14px",borderRadius:20,marginBottom:20}}>
          <span style={{width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block"}}/>
          <span style={{fontSize:11,fontWeight:700,color:C.amber,letterSpacing:"0.1em",textTransform:"uppercase"}}>Now Dispatching Nationwide</span>
        </div>
        <h1 style={{fontSize:"clamp(34px,5.5vw,60px)",fontWeight:900,color:C.chalk,lineHeight:1.05,margin:"0 0 18px",maxWidth:680,marginLeft:"auto",marginRight:"auto"}}>
          Moving Labor.<br/><span style={{color:C.amber}}>Any City.</span> Within Minutes.
        </h1>
        <p style={{fontSize:17,color:C.muted,maxWidth:500,margin:"0 auto 36px",lineHeight:1.6}}>
          TEMCO connects moving companies, carriers, and brokers with vetted crews anywhere in the US — automated, dispatched, confirmed.
        </p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>onNav("request")} style={{background:C.amber,color:C.navy,border:"none",padding:"14px 32px",borderRadius:8,fontSize:15,fontWeight:800,cursor:"pointer"}}>Request Labor Now →</button>
          <button onClick={()=>onNav("worker-signup")} style={{background:"transparent",color:C.chalk,border:`1px solid ${C.border}`,padding:"14px 28px",borderRadius:8,fontSize:15,fontWeight:600,cursor:"pointer"}}>Become a Helper</button>
        </div>
        {/* Live stats bar */}
        <div style={{display:"flex",gap:32,justifyContent:"center",marginTop:48,flexWrap:"wrap"}}>
          {[
            {val:`${workerCount}+`, lbl:"Vetted Workers"},
            {val:`${stateCount}`, lbl:"States Covered"},
            {val:"< 10 min", lbl:"Avg. Dispatch Time"},
            {val:"97%", lbl:"Fill Rate"},
          ].map(s=>(
            <div key={s.lbl} style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:C.amber}}>{s.val}</div>
              <div style={{fontSize:12,color:C.muted,marginTop:2}}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{padding:"56px 40px",maxWidth:900,margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:44}}>
          <div style={{fontSize:11,color:C.amber,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:8}}>The Process</div>
          <h2 style={{fontSize:28,fontWeight:800,color:C.chalk,margin:0}}>From Request to Confirmed Crew in Minutes</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:16}}>
          {[
            {step:"01",title:"Submit Request",desc:"Enter job location, date, crew size, and type of work needed."},
            {step:"02",title:"AI Matches Crew",desc:"System ranks nearby workers by distance, skill, certifications, and reliability."},
            {step:"03",title:"SMS Dispatch",desc:"Workers get a text instantly. YES/NO replies are tracked in real time."},
            {step:"04",title:"Crew Confirmed",desc:"You receive worker names, phones, crew lead — ready to roll."},
          ].map(s=>(
            <div key={s.step} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
              <div style={{fontSize:28,fontWeight:900,color:C.amber,opacity:0.35,fontFamily:"monospace"}}>{s.step}</div>
              <div style={{fontSize:15,fontWeight:700,color:C.chalk,margin:"8px 0 6px"}}>{s.title}</div>
              <div style={{fontSize:13,color:C.muted,lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div style={{background:C.navyMid,padding:"56px 40px",borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:560,margin:"0 auto",textAlign:"center"}}>
          <h2 style={{fontSize:26,fontWeight:800,color:C.chalk,margin:"0 0 8px"}}>Simple, Transparent Pricing</h2>
          <p style={{color:C.muted,marginBottom:32}}>One flat dispatch fee per worker. You pay workers directly on-site.</p>
          <div style={{background:C.navy,border:`1px solid ${C.border}`,borderRadius:14,padding:"32px 40px",display:"inline-block"}}>
            <div style={{fontSize:48,fontWeight:900,color:C.amber}}>$75–$125</div>
            <div style={{color:C.muted,fontSize:14,marginTop:4}}>per worker dispatched</div>
            <div style={{marginTop:20,color:C.chalk,opacity:0.7,fontSize:13,lineHeight:1.8}}>
              TEMCO never processes worker payroll.<br/>You pay workers directly on-site at your rate.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{padding:"32px 40px",textAlign:"center",color:C.muted,fontSize:12}}>
        <div style={{display:"flex",gap:20,justifyContent:"center",flexWrap:"wrap",marginBottom:12}}>
          {["About","Contact","Terms of Service","Privacy Policy"].map(l=>(
            <span key={l} style={{cursor:"pointer"}}>{l}</span>
          ))}
        </div>
        © 2026 TEMCO National Labor Dispatch Network. All rights reserved.
      </div>
    </div>
  );
}

// ─── REQUEST FORM ─────────────────────────────────────────────────────────────
function RequestForm({ onNav, addJob }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({company:"",contact:"",phone:"",email:"",location:"",state:"",date:"",time:"",crew:"4",type:"Load/Unload",duration:"4",notes:""});
  const [submitted, setSubmitted] = useState(false);
  const up = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleSubmit = () => {
    const fee = parseInt(form.crew) * 100;
    const jobId = `JOB-${1043 + Math.floor(Math.random()*100)}`;
    addJob({ id:jobId, customer:form.company, location:`${form.location}, ${form.state}`, date:form.date, time:form.time, crew:parseInt(form.crew), type:form.type, status:"Pending", fee, workerIds:[] });
    setSubmitted(true);
  };

  if (submitted) {
    const fee = parseInt(form.crew) * 100;
    return (
      <div style={{padding:"60px 40px",maxWidth:540,margin:"0 auto",textAlign:"center"}}>
        <div style={{fontSize:52,marginBottom:14}}>✅</div>
        <h2 style={{fontSize:24,fontWeight:800,color:C.chalk,marginBottom:8}}>Request Submitted</h2>
        <p style={{color:C.muted,marginBottom:28}}>Our AI dispatch system is matching your crew now. You'll receive an SMS and email confirmation shortly.</p>
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:24,textAlign:"left"}}>
          {[[`Location`,`${form.location}, ${form.state}`],[`Date`,form.date],[`Time`,form.time],[`Crew`,`${form.crew} workers`],[`Work Type`,form.type]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.chalk,fontWeight:600,fontSize:13}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:14,marginTop:4}}>
            <span style={{color:C.chalk,fontWeight:700}}>Dispatch Fee</span>
            <span style={{color:C.amber,fontWeight:900,fontSize:20}}>${fee}</span>
          </div>
        </div>
        <button onClick={()=>onNav("customer-portal")} style={btn()}>View in Customer Portal →</button>
      </div>
    );
  }

  const steps = ["Company Info","Job Details","Review & Submit"];
  return (
    <div style={{padding:"36px",maxWidth:580,margin:"0 auto"}}>
      <SectionTitle title="Request Labor" sub="Crews matched and confirmed automatically." />
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {steps.map((s,i)=>(
          <div key={s} style={{flex:1,textAlign:"center"}}>
            <div style={{height:3,borderRadius:2,marginBottom:7,background:i<step-1?C.amber:i===step-1?C.amber:C.border,opacity:i>=step?0.25:1}}/>
            <div style={{fontSize:10,color:step===i+1?C.amber:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em"}}>{s}</div>
          </div>
        ))}
      </div>

      {step===1 && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div><label style={label}>Company Name</label><input style={field} value={form.company} onChange={e=>up("company",e.target.value)} placeholder="Two Men and a Truck – Dallas"/></div>
          <div><label style={label}>Contact Name</label><input style={field} value={form.contact} onChange={e=>up("contact",e.target.value)} placeholder="Brian Cole"/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={label}>Phone</label><input style={field} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="(214) 555-0000"/></div>
            <div><label style={label}>Email</label><input style={field} value={form.email} onChange={e=>up("email",e.target.value)} placeholder="you@company.com"/></div>
          </div>
        </div>
      )}

      {step===2 && (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
            <div><label style={label}>City</label><input style={field} value={form.location} onChange={e=>up("location",e.target.value)} placeholder="Dallas"/></div>
            <div>
              <label style={label}>State</label>
              <select style={field} value={form.state} onChange={e=>up("state",e.target.value)}>
                <option value="">Select</option>
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div><label style={label}>Date</label><input type="date" style={field} value={form.date} onChange={e=>up("date",e.target.value)}/></div>
            <div><label style={label}>Start Time</label><input type="time" style={field} value={form.time} onChange={e=>up("time",e.target.value)}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <div>
              <label style={label}>Crew Size</label>
              <select style={field} value={form.crew} onChange={e=>up("crew",e.target.value)}>
                {[1,2,3,4,5,6,7,8,10,12].map(n=><option key={n} value={n}>{n} workers</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Type of Work</label>
              <select style={field} value={form.type} onChange={e=>up("type",e.target.value)}>
                {["Load/Unload","Packing","Assembly","Full Service","Driving","Inventory"].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div><label style={label}>Est. Duration (hours)</label><input style={field} value={form.duration} onChange={e=>up("duration",e.target.value)} placeholder="4"/></div>
          <div><label style={label}>Special Requirements</label><textarea style={{...field,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Stairs, heavy items, military base access needed..."/></div>
        </div>
      )}

      {step===3 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:14}}>Order Summary</div>
          {[["Company",form.company],["Contact",form.contact],["Location",`${form.location}, ${form.state}`],["Date & Time",`${form.date} at ${form.time}`],["Crew Size",`${form.crew} workers`],["Work Type",form.type],["Duration",`${form.duration} hrs`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
              <span style={{color:C.muted,fontSize:13}}>{k}</span>
              <span style={{color:C.chalk,fontSize:13,fontWeight:600}}>{v||"—"}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:14,marginTop:4}}>
            <span style={{color:C.chalk,fontWeight:700}}>Dispatch Fee</span>
            <span style={{color:C.amber,fontWeight:900,fontSize:22}}>${parseInt(form.crew||0)*100}</span>
          </div>
          <div style={{fontSize:11,color:C.muted,marginTop:8}}>Pay workers directly on-site. TEMCO never processes payroll.</div>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:20}}>
        {step>1 && <button onClick={()=>setStep(s=>s-1)} style={btn("ghost")}>← Back</button>}
        <button onClick={()=>step<3?setStep(s=>s+1):handleSubmit()} style={{...btn(),flex:1}}>
          {step===3?"Submit & Dispatch →":"Continue →"}
        </button>
      </div>
    </div>
  );
}

// ─── WORKER SIGNUP ────────────────────────────────────────────────────────────
function WorkerSignup() {
  const [form, setForm] = useState({name:"",phone:"",email:"",city:"",state:"",skills:[],experience:"",notes:""});
  const [submitted, setSubmitted] = useState(false);
  const up = (k,v) => setForm(p=>({...p,[k]:v}));
  const toggleSkill = s => setForm(p=>({...p,skills:p.skills.includes(s)?p.skills.filter(x=>x!==s):[...p.skills,s]}));

  if (submitted) return (
    <div style={{padding:"64px 40px",maxWidth:460,margin:"0 auto",textAlign:"center"}}>
      <div style={{fontSize:52,marginBottom:14}}>🎉</div>
      <h2 style={{fontSize:22,fontWeight:800,color:C.chalk}}>Application Received</h2>
      <p style={{color:C.muted,lineHeight:1.7}}>We'll review your profile and reach out within 24 hours. Once approved, you'll receive job offers via SMS — no app needed.</p>
    </div>
  );

  return (
    <div style={{padding:"36px",maxWidth:540,margin:"0 auto"}}>
      <SectionTitle title="Become a Helper" sub="Join the TEMCO network. Get paid moving jobs texted directly to your phone." />
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        <div><label style={label}>Full Name</label><input style={field} value={form.name} onChange={e=>up("name",e.target.value)} placeholder="Marcus Johnson"/></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <div><label style={label}>Phone</label><input style={field} value={form.phone} onChange={e=>up("phone",e.target.value)} placeholder="(214) 555-0000"/></div>
          <div><label style={label}>Email</label><input style={field} value={form.email} onChange={e=>up("email",e.target.value)} placeholder="you@email.com"/></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12}}>
          <div><label style={label}>City</label><input style={field} value={form.city} onChange={e=>up("city",e.target.value)} placeholder="Dallas"/></div>
          <div>
            <label style={label}>State</label>
            <select style={field} value={form.state} onChange={e=>up("state",e.target.value)}>
              <option value="">Select</option>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div><label style={label}>Years of Experience</label><input style={field} value={form.experience} onChange={e=>up("experience",e.target.value)} placeholder="e.g. 8 years"/></div>
        <div>
          <label style={label}>Skills (select all that apply)</label>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
            {SKILL_TYPES.map(s=>(
              <button key={s} onClick={()=>toggleSkill(s)} style={{
                padding:"6px 13px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",
                background:form.skills.includes(s)?C.amber:C.navyMid,
                color:form.skills.includes(s)?C.navy:C.muted,
                border:`1px solid ${form.skills.includes(s)?C.amber:C.border}`
              }}>{s}</button>
            ))}
          </div>
        </div>
        <div><label style={label}>Notes / Equipment / Crew Size</label><textarea style={{...field,resize:"vertical",minHeight:72}} value={form.notes} onChange={e=>up("notes",e.target.value)} placeholder="Own tools, dollies, travel radius, crew size..."/></div>
        <button onClick={()=>setSubmitted(true)} style={{...btn(),padding:"13px",fontSize:14,marginTop:4}}>Submit Application →</button>
      </div>
    </div>
  );
}

// ─── CUSTOMER PORTAL ──────────────────────────────────────────────────────────
function CustomerPortal({ jobs }) {
  const [tab, setTab] = useState("jobs");
  const myJobs = jobs.slice(0,4);
  const totalSpend = myJobs.reduce((a,j)=>a+j.fee,0);

  return (
    <div style={{padding:"30px"}}>
      <SectionTitle title="Customer Portal" sub="Track jobs, manage crews, and view invoices." />
      <Tabs tabs={[["jobs","My Jobs"],["billing","Invoices"],["request","New Request"]]} active={tab} onChange={setTab}/>

      {tab==="jobs" && (
        <>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Total Jobs" value={myJobs.length} />
            <StatCard label="Active" value={myJobs.filter(j=>j.status==="In Progress"||j.status==="Confirmed").length} color={C.amber}/>
            <StatCard label="Total Spent" value={`$${totalSpend.toLocaleString()}`} color={C.green}/>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Job ID","Location","Date","Crew","Type","Fee","Status"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{myJobs.map(j=>(
                <tr key={j.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"11px 12px",color:C.amber,fontWeight:700}}>{j.id}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.location}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.date}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.crew}</td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{j.type}</td>
                  <td style={{padding:"11px 12px",color:C.green,fontWeight:700}}>${j.fee}</td>
                  <td style={{padding:"11px 12px"}}><Badge status={j.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab==="billing" && (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {myJobs.map(j=>(
            <div key={j.id} style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:10,padding:"15px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:10}}>
              <div>
                <div style={{fontWeight:700,color:C.chalk}}>{j.id} — {j.location}</div>
                <div style={{fontSize:12,color:C.muted}}>{j.date} · {j.crew} workers · {j.type}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:18,fontWeight:800,color:C.amber}}>${j.fee}</span>
                <Badge status={j.status==="Completed"?"Completed":"Confirmed"}/>
                <button style={{...btn("secondary"),fontSize:11,padding:"5px 12px"}}>Receipt</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab==="request" && <RequestForm onNav={()=>setTab("jobs")} addJob={()=>{}} />}
    </div>
  );
}

// ─── WORKER PORTAL ────────────────────────────────────────────────────────────
function WorkerPortal() {
  const [avail, setAvail] = useState(true);
  const [responded, setResponded] = useState(null);
  const worker = ALL_WORKERS[0];

  return (
    <div style={{padding:"30px"}}>
      <SectionTitle title="Worker Portal" sub="Manage your profile, availability, and job offers." />
      <div style={{display:"grid",gridTemplateColumns:"260px 1fr",gap:22,flexWrap:"wrap"}}>
        {/* Profile card */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{width:54,height:54,borderRadius:"50%",background:C.amber,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:C.navy,marginBottom:14}}>
              {worker.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
            </div>
            <div style={{fontWeight:800,fontSize:17,color:C.chalk}}>{worker.name}</div>
            <div style={{fontSize:13,color:C.muted,marginTop:2}}>{worker.city}, {worker.state}</div>
            <div style={{marginTop:12,display:"flex",gap:6,flexWrap:"wrap"}}>
              {worker.skills.slice(0,3).map(s=>(
                <span key={s} style={{background:C.navyLight,color:C.chalk,padding:"3px 9px",borderRadius:20,fontSize:10,fontWeight:600}}>{s}</span>
              ))}
            </div>
            <div style={{marginTop:14,fontSize:12,color:C.muted}}>{worker.comments?.slice(0,80)}...</div>
          </div>
          {/* Availability toggle */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Availability</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{color:avail?C.green:C.red,fontWeight:700,fontSize:14}}>{avail?"Available":"Unavailable"}</span>
              <div onClick={()=>setAvail(a=>!a)} style={{width:44,height:24,borderRadius:12,cursor:"pointer",background:avail?C.green:C.border,position:"relative",transition:"background 0.2s"}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:avail?23:3,transition:"left 0.2s"}}/>
              </div>
            </div>
          </div>
          {/* Stats */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:18}}>
            <div style={{fontSize:11,color:C.muted,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Your Stats</div>
            {[["Jobs Completed","0"],["Network Status","Pending Approval"],["Certifications",worker.cids||"None listed"]].map(([k,v])=>(
              <div key={k} style={{marginBottom:10}}>
                <div style={{fontSize:11,color:C.muted}}>{k}</div>
                <div style={{color:C.chalk,fontWeight:600,fontSize:13}}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SMS job offer preview */}
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:4}}>Incoming Job Offer</div>
            <div style={{fontSize:12,color:C.muted,marginBottom:16}}>This is how TEMCO dispatch texts will appear on your phone</div>
            <div style={{background:"#0D1B2A",border:`1px solid ${C.border}`,borderRadius:12,padding:20,fontFamily:"monospace",fontSize:13,color:"#CBD5E1",lineHeight:2}}>
              <div style={{color:C.muted,fontSize:11,marginBottom:8}}>From: TEMCO Dispatch · {new Date().toLocaleTimeString()}</div>
              🚛 Job Offer — TEMCO Dispatch<br/>
              ─────────────────────<br/>
              📍 Dallas, TX 75201<br/>
              📅 Jun 12 @ 8:00 AM<br/>
              👥 4 Loaders needed<br/>
              ⏱ Est. 4 hours<br/>
              💵 Pay: $150–200 (cash on-site)<br/>
              ─────────────────────<br/>
              Reply YES to confirm<br/>
              Reply NO to decline<br/>
              Reply STOP to opt out
            </div>
            {!responded ? (
              <div style={{display:"flex",gap:10,marginTop:16}}>
                <button onClick={()=>setResponded("yes")} style={{flex:1,background:C.green,color:"white",border:"none",padding:"11px",borderRadius:8,fontWeight:800,cursor:"pointer",fontSize:14}}>✓ YES — Accept Job</button>
                <button onClick={()=>setResponded("no")} style={{flex:1,background:C.navyLight,color:C.muted,border:`1px solid ${C.border}`,padding:"11px",borderRadius:8,fontWeight:700,cursor:"pointer",fontSize:14}}>✗ NO — Decline</button>
              </div>
            ) : (
              <div style={{marginTop:16,padding:14,borderRadius:8,background:responded==="yes"?"#163B2A":"#2A1A1A",color:responded==="yes"?C.green:C.red,fontWeight:700,textAlign:"center"}}>
                {responded==="yes"?"✓ Confirmed! You'll receive full job details shortly.":"✗ Declined. We'll send you the next available job."}
              </div>
            )}
          </div>

          {/* How it works for workers */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:14}}>How TEMCO Works for You</div>
            {[
              ["1","Get job offers by text","No app needed. Offers come straight to your phone."],
              ["2","Reply YES or NO","Simple one-word reply. System handles the rest."],
              ["3","Show up and get paid","Customer pays you directly on-site at the agreed rate."],
            ].map(([n,t,d])=>(
              <div key={n} style={{display:"flex",gap:12,marginBottom:14}}>
                <div style={{width:24,height:24,borderRadius:"50%",background:C.amber,color:C.navy,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flexShrink:0}}>{n}</div>
                <div>
                  <div style={{color:C.chalk,fontWeight:600,fontSize:13}}>{t}</div>
                  <div style={{color:C.muted,fontSize:12,marginTop:2}}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PORTAL ─────────────────────────────────────────────────────────────
function AdminPortal({ jobs }) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const filteredWorkers = useMemo(() => {
    return ALL_WORKERS.filter(w => {
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.city.toLowerCase().includes(search.toLowerCase()) || w.comments?.toLowerCase().includes(search.toLowerCase());
      const matchState = !stateFilter || w.state === stateFilter;
      const matchSkill = !skillFilter || w.skills.includes(skillFilter);
      const matchStatus = !statusFilter || w.status === statusFilter;
      return matchSearch && matchState && matchSkill && matchStatus;
    });
  }, [search, stateFilter, skillFilter, statusFilter]);

  const byState = STATES.map(s=>({state:s, count:ALL_WORKERS.filter(w=>w.state===s).length})).sort((a,b)=>b.count-a.count);
  const totalFees = jobs.reduce((a,j)=>a+j.fee,0);

  return (
    <div style={{padding:"28px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <SectionTitle title="Admin Dashboard" sub="TEMCO National Dispatch Operations" />
        <div style={{display:"flex",alignItems:"center",gap:8,background:C.navyMid,padding:"6px 14px",borderRadius:8,border:`1px solid ${C.border}`}}>
          <div style={{width:7,height:7,borderRadius:"50%",background:C.green,boxShadow:`0 0 8px ${C.green}`}}/>
          <span style={{color:C.green,fontSize:12,fontWeight:700}}>SYSTEM LIVE</span>
        </div>
      </div>

      <Tabs tabs={[["overview","Overview"],["workers","Workers"],["jobs","All Jobs"],["dispatch","Dispatch Sim"]]} active={tab} onChange={setTab}/>

      {/* ── OVERVIEW ── */}
      {tab==="overview" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:24,flexWrap:"wrap"}}>
            <StatCard label="Workers in Network" value={ALL_WORKERS.length} color={C.green} sub={`${STATES.length} states`}/>
            <StatCard label="Active Jobs" value={jobs.filter(j=>j.status==="In Progress"||j.status==="Confirmed").length} color={C.amber}/>
            <StatCard label="Revenue (MTD)" value={`$${totalFees.toLocaleString()}`} color={C.chalk}/>
            <StatCard label="Fill Rate" value="97%" color={C.green}/>
          </div>

          {/* Live jobs */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22,marginBottom:20}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
              <span>Live Dispatch Activity</span>
              <div style={{width:6,height:6,borderRadius:"50%",background:C.green,boxShadow:`0 0 6px ${C.green}`}}/>
            </div>
            {jobs.filter(j=>j.status!=="Completed").map(j=>(
              <div key={j.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"11px 0",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",gap:8}}>
                <div>
                  <span style={{color:C.amber,fontWeight:700,marginRight:10}}>{j.id}</span>
                  <span style={{color:C.chalk,fontSize:13}}>{j.customer}</span>
                </div>
                <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
                  <span style={{color:C.muted,fontSize:12}}>{j.location} · {j.date}</span>
                  <span style={{color:C.chalk,fontSize:12}}>{j.crew} workers</span>
                  <span style={{color:C.green,fontWeight:700,fontSize:13}}>${j.fee}</span>
                  <Badge status={j.status}/>
                </div>
              </div>
            ))}
          </div>

          {/* Workers by state */}
          <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
            <div style={{fontWeight:700,color:C.chalk,marginBottom:16}}>Network Coverage by State</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {byState.slice(0,16).map(({state:st,count})=>(
                <div key={st} style={{background:C.navyLight,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{color:C.chalk,fontWeight:600,fontSize:13}}>{st}</span>
                  <span style={{color:C.amber,fontWeight:800,fontSize:14}}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── WORKERS ── */}
      {tab==="workers" && (
        <div>
          <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
            <StatCard label="Total Workers" value={ALL_WORKERS.length} sub={`${STATES.length} states covered`}/>
            <StatCard label="With Crew/Team" value={ALL_WORKERS.filter(w=>w.crew).length} color={C.amber}/>
            <StatCard label="Military Base Access" value={ALL_WORKERS.filter(w=>w.bases).length} color={C.green}/>
            <StatCard label="Experienced (10+ yrs)" value={ALL_WORKERS.filter(w=>w.experience&&parseInt(w.experience)>=10).length} color={C.blue}/>
          </div>

          {/* Filters */}
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <input style={{...field,flex:2,minWidth:160}} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, city, or skill..."/>
            <select style={{...field,flex:1,minWidth:100}} value={stateFilter} onChange={e=>setStateFilter(e.target.value)}>
              <option value="">All States</option>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>
            <select style={{...field,flex:1,minWidth:120}} value={skillFilter} onChange={e=>setSkillFilter(e.target.value)}>
              <option value="">All Skills</option>
              {SKILL_TYPES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>

          <div style={{fontSize:12,color:C.muted,marginBottom:12}}>Showing {filteredWorkers.length} of {ALL_WORKERS.length} workers</div>

          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
                {["Name","Location","Phone","Skills","Certifications","Crew/Travel","Status"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{filteredWorkers.slice(0,50).map(w=>(
                <tr key={w.id} style={{borderBottom:`1px solid ${C.border}`}}>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{color:C.chalk,fontWeight:600}}>{w.name}</div>
                    {w.experience && <div style={{fontSize:10,color:C.amber}}>{w.experience} exp</div>}
                  </td>
                  <td style={{padding:"11px 12px",color:C.chalk}}>{w.city}, {w.state}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:12}}>{w.phone}</td>
                  <td style={{padding:"11px 12px"}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {w.skills.slice(0,2).map(s=><span key={s} style={{background:C.navyLight,color:C.muted,padding:"2px 7px",borderRadius:10,fontSize:9,fontWeight:700}}>{s}</span>)}
                      {w.skills.length>2 && <span style={{color:C.muted,fontSize:10}}>+{w.skills.length-2}</span>}
                    </div>
                  </td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:11}}>{w.cids?.slice(0,20)||"—"}{w.cids?.length>20?"...":""}</td>
                  <td style={{padding:"11px 12px",color:C.muted,fontSize:11}}>
                    {w.crew && <div>👥 {w.crew} crew</div>}
                    {w.travel && <div>📍 {w.travel}</div>}
                    {w.bases && <div style={{color:C.blue}}>🪖 Base access</div>}
                  </td>
                  <td style={{padding:"11px 12px"}}><Badge status={w.status}/></td>
                </tr>
              ))}</tbody>
            </table>
            {filteredWorkers.length>50 && <div style={{padding:14,color:C.muted,fontSize:12,textAlign:"center"}}>Showing first 50 results. Refine filters to narrow down.</div>}
          </div>
        </div>
      )}

      {/* ── ALL JOBS ── */}
      {tab==="jobs" && (
        <div style={{overflowX:"auto"}}>
          <div style={{display:"flex",gap:14,marginBottom:20,flexWrap:"wrap"}}>
            <StatCard label="Total Jobs" value={jobs.length}/>
            <StatCard label="Revenue" value={`$${totalFees.toLocaleString()}`} color={C.green}/>
            <StatCard label="Completed" value={jobs.filter(j=>j.status==="Completed").length} color={C.muted}/>
          </div>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>
              {["Job ID","Customer","Location","Date","Crew","Fee","Status"].map(h=>(
                <th key={h} style={{textAlign:"left",padding:"9px 12px",color:C.muted,fontWeight:700,fontSize:10,textTransform:"uppercase"}}>{h}</th>
              ))}
            </tr></thead>
            <tbody>{jobs.map(j=>(
              <tr key={j.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:"11px 12px",color:C.amber,fontWeight:700}}>{j.id}</td>
                <td style={{padding:"11px 12px",color:C.chalk}}>{j.customer}</td>
                <td style={{padding:"11px 12px",color:C.chalk}}>{j.location}</td>
                <td style={{padding:"11px 12px",color:C.chalk}}>{j.date}</td>
                <td style={{padding:"11px 12px",color:C.chalk}}>{j.crew}</td>
                <td style={{padding:"11px 12px",color:C.green,fontWeight:700}}>${j.fee}</td>
                <td style={{padding:"11px 12px"}}><Badge status={j.status}/></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* ── DISPATCH SIM ── */}
      {tab==="dispatch" && <DispatchSim />}
    </div>
  );
}

// ─── DISPATCH SIMULATOR ───────────────────────────────────────────────────────
function DispatchSim() {
  const [state, setState] = useState("");
  const [skill, setSkill] = useState("Loading");
  const [crew, setCrew] = useState(4);
  const [dispatched, setDispatched] = useState(false);
  const [responses, setResponses] = useState({});

  const candidates = useMemo(()=>{
    if (!state) return [];
    return ALL_WORKERS.filter(w=>w.state===state&&w.skills.includes(skill)).slice(0,crew+2);
  },[state,skill,crew]);

  const runDispatch = () => {
    setDispatched(true);
    const r = {};
    candidates.forEach((w,i)=>{
      r[w.id] = i < crew ? "YES" : "BACKUP";
    });
    setResponses(r);
  };

  return (
    <div>
      <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:24,marginBottom:20}}>
        <div style={{fontWeight:700,color:C.chalk,marginBottom:16}}>AI Dispatch Simulator</div>
        <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Simulate how the AI matching agent would find and dispatch workers for a job.</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
          <div>
            <label style={label}>State</label>
            <select style={field} value={state} onChange={e=>{setState(e.target.value);setDispatched(false);}}>
              <option value="">Select state</option>
              {STATES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Skill Needed</label>
            <select style={field} value={skill} onChange={e=>{setSkill(e.target.value);setDispatched(false);}}>
              {SKILL_TYPES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={label}>Crew Size</label>
            <select style={field} value={crew} onChange={e=>{setCrew(parseInt(e.target.value));setDispatched(false);}}>
              {[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n} workers</option>)}
            </select>
          </div>
        </div>
        <button onClick={runDispatch} disabled={!state} style={{...btn(),opacity:state?1:0.5}}>
          🤖 Run AI Dispatch →
        </button>
      </div>

      {candidates.length>0 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22}}>
          <div style={{fontWeight:700,color:C.chalk,marginBottom:6}}>
            {dispatched ? `Dispatch Sent — ${candidates.length} workers contacted` : `${candidates.length} workers found in ${state} for ${skill}`}
          </div>
          <div style={{fontSize:12,color:C.muted,marginBottom:16}}>
            {dispatched ? `Targeting ${crew} confirmed + ${candidates.length-crew} backups` : "Run dispatch to send SMS offers"}
          </div>
          {candidates.map((w,i)=>(
            <div key={w.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:`1px solid ${C.border}`,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{color:C.chalk,fontWeight:600}}>{w.name}</div>
                <div style={{fontSize:12,color:C.muted}}>{w.city}, {w.state} · {w.phone}</div>
                {w.experience && <div style={{fontSize:11,color:C.amber}}>{w.experience} experience</div>}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                {dispatched && (
                  <div style={{
                    padding:"3px 12px",borderRadius:20,fontSize:11,fontWeight:800,
                    background:responses[w.id]==="YES"?"#163B2A":responses[w.id]==="BACKUP"?"#1A2030":"#2A1A1A",
                    color:responses[w.id]==="YES"?C.green:responses[w.id]==="BACKUP"?C.blue:C.red
                  }}>
                    {responses[w.id]==="YES"?"✓ CONFIRMED":responses[w.id]==="BACKUP"?"⏳ BACKUP":"📱 SENT"}
                  </div>
                )}
                <div style={{background:C.navyLight,padding:"3px 10px",borderRadius:10,fontSize:10,color:C.muted,fontWeight:600}}>
                  #{i+1} match
                </div>
              </div>
            </div>
          ))}
          {dispatched && (
            <div style={{marginTop:16,padding:14,background:"#163B2A",borderRadius:8,color:C.green,fontWeight:700,fontSize:13}}>
              ✓ {crew} workers confirmed for dispatch · Dispatch fee: ${crew*100} · Worker info will release upon payment
            </div>
          )}
        </div>
      )}

      {state && candidates.length===0 && (
        <div style={{background:C.navyMid,border:`1px solid ${C.border}`,borderRadius:12,padding:22,color:C.muted,textAlign:"center"}}>
          No workers found for {skill} in {state}. Try a different state or skill.
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [jobs, setJobs] = useState(INITIAL_JOBS);

  const addJob = (job) => setJobs(prev => [job, ...prev]);

  const NAV_LEFT = [
    {id:"home",label:"Home"},
    {id:"request",label:"Request Labor"},
    {id:"worker-signup",label:"Become a Helper"},
  ];
  const NAV_RIGHT = [
    {id:"customer-portal",label:"Customer Portal"},
    {id:"worker-portal",label:"Worker Portal"},
    {id:"admin",label:"⚙ Admin"},
  ];

  const pages = {
    home:<PublicHome onNav={setPage}/>,
    request:<RequestForm onNav={setPage} addJob={addJob}/>,
    "worker-signup":<WorkerSignup/>,
    "customer-portal":<CustomerPortal jobs={jobs}/>,
    "worker-portal":<WorkerPortal/>,
    admin:<AdminPortal jobs={jobs}/>,
  };

  return (
    <div style={{minHeight:"100vh",background:C.navy,color:C.chalk,fontFamily:"'Space Grotesk','Inter',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <nav style={{background:C.navy,borderBottom:`1px solid ${C.border}`,padding:"0 20px",display:"flex",alignItems:"center",justifyContent:"space-between",height:56,position:"sticky",top:0,zIndex:100,flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div onClick={()=>setPage("home")} style={{cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
            <div style={{background:C.amber,width:30,height:30,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color:C.navy}}>T</div>
            <div>
              <div style={{fontWeight:900,fontSize:14,letterSpacing:"0.08em",color:C.chalk,lineHeight:1}}>TEMCO</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:"0.05em",textTransform:"uppercase"}}>Labor Dispatch</div>
            </div>
          </div>
          <div style={{display:"flex",gap:3}}>
            {NAV_LEFT.map(n=>(
              <button key={n.id} onClick={()=>setPage(n.id)} style={{background:page===n.id?C.navyMid:"transparent",color:page===n.id?C.amber:C.muted,border:page===n.id?`1px solid ${C.border}`:"1px solid transparent",padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>{n.label}</button>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:3}}>
          {NAV_RIGHT.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} style={{background:page===n.id?C.navyMid:"transparent",color:page===n.id?C.amber:C.muted,border:page===n.id?`1px solid ${C.border}`:"1px solid transparent",padding:"5px 11px",borderRadius:7,fontSize:12,fontWeight:600,cursor:"pointer"}}>{n.label}</button>
          ))}
        </div>
      </nav>

      <main>{pages[page]}</main>
    </div>
  );
}
