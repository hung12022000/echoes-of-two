# Oceanbound expansion plan

This plan adapts `docs/Oceanbound_Game_Design_Master.md` to the existing Babylon.js web game. It keeps Hưng and Mei.100, the Vietnamese coast and the cooperative boss slice. The master document's Unity/C# examples are design guidance, not a request to discard the working web project.

## Product identity

Hưng and Mei.100 survive a living archipelago after an anomalous ocean signal wakes ancient machines beneath Hạ Long–inspired limestone formations. Hưng is strongest at construction, anchoring and close defense. Mei.100 is strongest at navigation, energy systems and scanning. Neither role is a hard lock: playing together creates efficiency and tactical bonuses, while solo remains viable with an AI companion.

The distinctive loop is:

```text
read the sea → prepare together → travel → recover resources
→ combine materials → build a safer home → mark discoveries
→ survive a dynamic threat → unlock a farther route
```

## Implemented vertical slice

- Raw resources: driftwood, recycled plastic, palm fiber, stone, scrap, coconut and fish.
- Processing: rope, plank, charcoal, fresh water and cooked fish.
- Equipment: salvage hook and survival spear.
- Construction: foundation, wall, door, roof, chest, grill, purifier, claim beacon, storm anchor and lightning rod.
- World: animated sea, starter raft, coastal salvage, shark presence, island base development and a tropical storm cycle.
- Navigation: persistent named markers, notes, types, coordinates, waypoint and distance.
- Co-op: host-authoritative movement/combat plus shared crafting/build/marker state.

## Next playable chapter — The First Storm

The next production target should be one polished 25–35 minute scenario rather than dozens of disconnected systems:

1. Gather enough salvage for a hook, purifier and four foundation pieces.
2. Discover the shallow wreck and recover a weather receiver blueprint.
3. Read a storm warning with a visible countdown.
4. Choose whether to reinforce the raft or establish a high-ground island shelter.
5. During the storm, repair two damaged modules while avoiding lightning telegraphs and shark attacks.
6. The eye of the storm creates a brief rescue window for the second player.
7. Surviving reveals a new cave and rewards the navigation beacon blueprint.
8. Placing the beacon upgrades the island to an Outpost and adds it to both players' map.

This chapter connects gathering, crafting, building, weather and co-op into one memorable arc.

## Architecture increments

Keep the current data-driven catalog and split future systems by responsibility:

- `inventory`: slots, weight, stacking, equipment and storage containers.
- `crafting`: stations, recipe resolver, technology gates, queues and byproducts.
- `building`: preview/validation, sockets, stability, damage, repair and island persistence.
- `ocean`: seeded debris lanes, currents, raft buoyancy, day/night and biome activation.
- `weather`: forecast, storm phases, lightning telegraphs, flooding and recovery rewards.
- `map`: fog of war, discoveries, markers, waypoints and shared co-op annotations.
- `creatures`: distance-activated state machines for fish, shark, eel and Leviathan.
- `network`: host authority, command validation, snapshots, TURN relay and eventual host migration.

Do not put recipes or marker persistence in React UI. UI renders state and dispatches commands; simulation and validation stay in domain classes.

## Content progression

### Tier 0 — Adrift

Hook, rope, plank, coconut water, basic spear, four-tile raft and emergency marker. Threats are dehydration, reef shark and short squalls.

### Tier 1 — Island camp

Purifier, grill, storage, cabin pieces, rain collector, planter and claim beacon. Threats are tropical storm, lightning and night predators.

### Tier 2 — Outpost network

Furnace, metal plate, copper wire, battery, radio and reinforced dock. New play includes wreck salvage, faction signals and logistics between two islands.

### Tier 3 — Blue-water expedition

Engine, fuel, scanner, diving set and research bench. The map gains depth bands, weather fronts and long-range routes.

### Tier 4 — Abyss approach

Pressure modules, submarine, underwater habitat and ancient signal decoder. Threats become pressure, giant squid, Deep Cult and unstable rifts.

### Tier 5 — Ocean Core

Leviathan encounter, faction choice, satellite network and one of several endings. Endgame keeps free building and discovery active afterward.

## Co-op interactions worth prioritizing

- One player steers through waves while the other repairs or works the sail.
- Hưng braces a structure while Mei.100 routes power through it, reducing build cost.
- Two-person hauling for engines, large chests and rescue stretchers.
- Shared map drawing and ping wheel; every pin records its creator.
- Revive inside storm shelter and tether rescue when one player falls overboard.
- Split-role boss telegraphs: sonar interpretation versus deck defense.

## Definition of the next release

- Two physical devices can connect through configured TURN when direct WebRTC fails.
- A new save can complete The First Storm from start to finish.
- A complete cabin can be placed, rotated, repaired, removed and reloaded.
- Storm damage is telegraphed and recoverable; it never deletes the whole base.
- The wreck, cave and player markers persist across reload.
- Host and guest see identical inventory, buildings, weather and map state.
- Automated tests cover recipe resolution, invalid build positions, save migration and multiplayer command validation.
