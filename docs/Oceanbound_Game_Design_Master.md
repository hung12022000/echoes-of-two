# OCEANBOUND — GAME DESIGN & CODEX MASTER SPECIFICATION

> **Mục tiêu:** Xây dựng một game 3D survival-crafting trên biển, lấy cảm hứng từ thể loại raft survival nhưng có hệ thống tiến trình, chế tạo, kết hợp vật phẩm, khám phá, xây dựng căn cứ nổi, sinh vật biển, lặn sâu, thời tiết, nhiệm vụ và cốt truyện riêng.
>
> **Tên tạm:** Oceanbound
>
> **Engine đề xuất:** Unity 6 + C#
>
> **Platform MVP:** Windows PC
>
> **MVP:** Single-player trước. Multiplayer 1–4 người chỉ triển khai sau khi core gameplay ổn định.
>
> **Nguyên tắc:** Không sao chép asset, tên, bản đồ, nhân vật, UI, âm thanh, story hoặc recipe cụ thể của bất kỳ game nào. Chỉ sử dụng ý tưởng thể loại ở mức khái quát.

---

# 1. TẦM NHÌN GAME

Người chơi tỉnh dậy giữa đại dương trên một bè gỗ nhỏ. Không có đất liền trong tầm mắt. Người chơi phải thu thập tài nguyên trôi nổi, chế tạo công cụ, lọc nước, kiếm thức ăn, mở rộng bè, khám phá đảo và xác tàu, lặn xuống biển, nghiên cứu công nghệ và tìm nguyên nhân khiến đại dương trở nên bất thường.

Game có 4 trụ cột:

1. **Survival** — đói, khát, sức khỏe, stamina, nhiệt độ.
2. **Crafting** — tài nguyên → nguyên liệu → linh kiện → thiết bị → công nghệ.
3. **Base Building** — biến bè nhỏ thành căn cứ nổi hoặc tàu khổng lồ.
4. **Exploration & Mystery** — đảo, xác tàu, thành phố chìm, tín hiệu lạ, vực sâu và boss.

Core fantasy:

> “Từ một người sống sót trên một mảnh gỗ trở thành người điều khiển một căn cứ nổi có khả năng khám phá toàn bộ đại dương.”

---

# 2. CORE GAME LOOP

```text
THU THẬP
   ↓
SINH TỒN
   ↓
CHẾ TẠO
   ↓
XÂY DỰNG
   ↓
KHÁM PHÁ
   ↓
TÌM BLUEPRINT
   ↓
NÂNG CẤP
   ↓
ĐI XA HƠN
   ↓
LẶN SÂU HƠN
   ↓
ĐỐI ĐẦU SINH VẬT
   ↓
MỞ KHÓA CÔNG NGHỆ
   ↓
KHÁM PHÁ BÍ MẬT ĐẠI DƯƠNG
```

Mỗi hệ thống phải phục vụ loop này. Không thêm mechanic chỉ để “cho nhiều tính năng”.

---

# 3. PLAYER

## 3.1 Chỉ số

- Health
- Hunger
- Thirst
- Stamina
- Oxygen
- Temperature
- Wetness
- Poison/Status Effects
- Carry Weight

## 3.2 Quy tắc survival

### Hunger

- 100% → bình thường.
- <50% → không phạt đáng kể.
- <25% → stamina hồi chậm.
- 0% → mất health từ từ.

### Thirst

- 100% → bình thường.
- <50% → stamina giảm nhẹ.
- <25% → stamina hồi rất chậm.
- 0% → mất health.

### Stamina

Dùng cho:

- chạy
- bơi
- leo
- đánh
- kéo vật
- một số hành động đặc biệt.

### Oxygen

Chỉ hoạt động khi ở dưới nước.

Oxygen giảm theo thời gian và tốc độ vận động.

Nếu Oxygen về 0:

- bắt đầu nhận damage theo tick;
- phải lập tức trở lên mặt nước hoặc dùng thiết bị hỗ trợ.

Không thiết kế hệ thống gây chết tức thì một cách khó chịu.

---

# 4. INVENTORY

## 4.1 Slot

Inventory gồm:

- Backpack
- Hotbar
- Equipment
- Storage

## 4.2 Item properties

Mỗi ItemData phải có:

```text
Id
DisplayName
Description
Category
SubCategory
MaxStack
Weight
Tier
Value
Icon
Prefab
Durability
Tags[]
CanCraft
CanConsume
CanEquip
CanBuild
CanResearch
```

## 4.3 Item categories

```text
Resource
Material
Component
Food
Drink
Tool
Weapon
Armor
Equipment
Building
Machine
Seed
Blueprint
QuestItem
KeyItem
Artifact
Fuel
Medical
Misc
```

---

# 5. HỆ THỐNG TÀI NGUYÊN

## TIER 0 — STARTER

- Driftwood
- Plastic Scrap
- Fiber
- Stone
- Palm Leaf
- Shell

## TIER 1 — BASIC

- Rope
- Plank
- Palm Wood
- Fresh Water
- Fish
- Coconut
- Plant Fiber
- Scrap Metal

## TIER 2 — INDUSTRIAL

- Iron Ore
- Copper Ore
- Glass
- Coal
- Metal Plate
- Metal Pipe
- Leather
- Resin

## TIER 3 — ADVANCED

- Steel
- Copper Wire
- Circuit Board
- Battery Cell
- Refined Glass
- Synthetic Fiber
- Fuel
- Engine Part

## TIER 4 — HIGH TECH

- Titanium
- Advanced Circuit
- Polymer
- Carbon Composite
- Servo
- Navigation Core
- High Density Battery

## TIER 5 — END GAME

- Abyss Crystal
- Ancient Alloy
- Ocean Core
- Leviathan Scale
- Quantum Component
- Ancient Data Core

---

# 6. QUY TẮC KẾT HỢP VẬT PHẨM

Đây là hệ thống quan trọng nhất.

Không chỉ có recipe kiểu:

```text
3 Wood + 2 Rope = Spear
```

Mà phải có chuỗi:

```text
Raw Resource
   ↓
Processing
   ↓
Material
   ↓
Component
   ↓
Device
   ↓
Advanced Device
```

Ví dụ:

```text
Iron Ore
 + Coal
 ↓
Smelt
 ↓
Iron Ingot
 + Hammer
 ↓
Metal Plate
 + Copper Wire
 + Circuit Board
 ↓
Basic Electronics
 + Battery
 + Motor
 ↓
Water Desalinator
```

---

# 7. CRAFTING RECIPE MASTER

## 7.1 Rope

```text
Plant Fiber x3
→ Rope x1
```

## 7.2 Plank

```text
Driftwood x2
→ Plank x1
```

## 7.3 Simple Spear

```text
Plank x2
+ Rope x1
+ Scrap Metal x1
→ Simple Spear
```

## 7.4 Hook

```text
Scrap Metal x1
+ Rope x2
+ Plank x1
→ Hook
```

## 7.5 Storage Box

```text
Plank x6
+ Rope x2
→ Storage Box
```

## 7.6 Simple Grill

```text
Plank x4
+ Scrap Metal x3
+ Stone x4
→ Simple Grill
```

## 7.7 Basic Water Collector

```text
Plastic Scrap x6
+ Rope x2
+ Palm Leaf x4
→ Water Collector
```

## 7.8 Basic Purifier

```text
Plastic Scrap x5
+ Charcoal x2
+ Rope x2
+ Scrap Metal x2
→ Basic Purifier
```

---

# 8. CRAFTING NÂNG CAO

## 8.1 Furnace

```text
Stone x12
+ Scrap Metal x6
+ Rope x2
→ Furnace
```

Furnace xử lý:

```text
Iron Ore + Fuel → Iron Ingot
Copper Ore + Fuel → Copper Ingot
Sand + Fuel → Glass
```

## 8.2 Metal Plate

```text
Iron Ingot x2
→ Metal Plate x1
```

## 8.3 Copper Wire

```text
Copper Ingot x1
→ Copper Wire x3
```

## 8.4 Circuit Board

```text
Copper Wire x2
+ Resin x1
+ Refined Glass x1
+ Metal Plate x1
→ Circuit Board
```

## 8.5 Battery

```text
Copper Wire x2
+ Metal Plate x2
+ Acid/Resin Component x1
+ Circuit Board x1
→ Battery
```

## 8.6 Small Engine

```text
Steel x8
+ Copper Wire x6
+ Circuit Board x2
+ Battery x1
+ Engine Part x4
→ Small Engine
```

---

# 9. HỆ THỐNG RECIPE THEO CÔNG NGHỆ

## Technology Tree

```text
SURVIVAL
├── Water
│   ├── Collector
│   ├── Purifier
│   └── Desalinator
│
├── Food
│   ├── Grill
│   ├── Farm
│   └── Refrigerator
│
├── Tools
│   ├── Hook
│   ├── Spear
│   ├── Axe
│   └── Repair Tool
│
├── Industry
│   ├── Furnace
│   ├── Smelter
│   ├── Workbench
│   └── Factory
│
├── Navigation
│   ├── Sail
│   ├── Engine
│   ├── Compass
│   ├── Scanner
│   └── Navigation Core
│
└── Deep Sea
    ├── Diving Mask
    ├── Oxygen Tank
    ├── Diving Suit
    ├── Pressure Gear
    └── Abyss Suit
```

---

# 10. BLUEPRINT SYSTEM

Không cho người chơi biết toàn bộ recipe từ đầu.

Blueprint có:

```text
BlueprintId
Name
Tier
RequiredResearch
RequiredStation
Materials
Unlocks
```

Blueprint sources:

- floating debris
- islands
- shipwrecks
- underwater chests
- abandoned labs
- NPC traders
- story rewards
- boss drops

Blueprint rarity:

```text
Common
Uncommon
Rare
Epic
Legendary
Ancient
```

---

# 11. QUALITY / VARIANT SYSTEM

Một số equipment có thể có modifier.

Ví dụ:

```text
Basic Diving Tank
Oxygen +60 sec

Reinforced Diving Tank
Oxygen +100 sec
Durability +20%

Advanced Diving Tank
Oxygen +180 sec
Movement penalty -10%
```

Không random stat quá mạnh trong MVP. Ưu tiên balance rõ ràng.

---

# 12. TOOL SYSTEM

## Axe

Dùng:

- tree
- palm
- wooden wreckage

Upgrade:

```text
Stone Axe
→ Scrap Axe
→ Metal Axe
→ Steel Axe
→ Titanium Axe
```

## Pickaxe

```text
Stone Pickaxe
→ Metal Pickaxe
→ Steel Pickaxe
→ Titanium Pickaxe
```

## Hook

Có:

- range
- speed
- durability
- pull strength

Upgrade:

```text
Basic Hook
→ Reinforced Hook
→ Magnetic Hook
→ Powered Grapple
```

---

# 13. WEAPON SYSTEM

Không tập trung vào súng đạn.

## Melee

- Spear
- Reinforced Spear
- Harpoon
- Electric Spear

## Ranged

- Bow
- Harpoon Launcher
- Compressed Air Launcher

## Utility

- Net Launcher
- Flare
- Shock Device

Mỗi vũ khí có:

```text
Damage
Range
AttackSpeed
StaminaCost
Durability
DamageType
SpecialEffect
```

---

# 14. ARMOR / EQUIPMENT

## Body

```text
Cloth Outfit
→ Reinforced Outfit
→ Diving Suit
→ Pressure Suit
→ Abyss Suit
```

## Head

```text
Basic Mask
→ Diving Mask
→ Advanced Helmet
→ Abyss Helmet
```

## Back

```text
Small Oxygen Tank
→ Large Oxygen Tank
→ Advanced Tank
```

## Feet

```text
Basic Fins
→ Reinforced Fins
→ Propulsion Fins
```

Equipment phải phối hợp với nhau.

Ví dụ:

```text
Diving Mask
+ Oxygen Tank
+ Fins
=
Full Diving Set
```

Full set có bonus:

```text
Oxygen +15%
Swim Speed +10%
```

---

# 15. COMBINATION / SYNERGY SYSTEM

Một vật phẩm có thể có Tags:

```text
Metal
Electrical
Water
Heat
Pressure
Mechanical
Organic
Abyss
```

Recipe có thể yêu cầu Tags.

Ví dụ:

```text
Water + Electrical + Metal
→ Desalinator
```

```text
Pressure + Metal + Oxygen
→ Deep Diving Equipment
```

```text
Mechanical + Electrical + Fuel
→ Engine
```

```text
Abyss + Electrical + Ancient
→ Ocean Core Device
```

Điều này giúp hệ thống dễ mở rộng hơn hard-code từng item.

---

# 16. FARMING

Người chơi có thể trồng:

- Coconut
- Potato
- Carrot
- Seaweed
- Tomato
- Medicinal Plant
- Fiber Plant

Farm yêu cầu:

```text
Planter
+ Seed
+ Water
+ Time
```

Một số cây cần:

- Fresh Water
- Fertilizer
- Specific biome

---

# 17. COOKING

Cooking không chỉ là “raw fish → cooked fish”.

Có Ingredient Tags:

```text
Fish
Protein
Vegetable
Fruit
Carb
Herb
```

Ví dụ:

```text
Fish + Vegetable
→ Fish Stew
```

```text
Fish + Coconut
→ Coconut Fish
```

```text
Potato + Fish + Herb
→ Survival Meal
```

```text
Rare Fish + Medicinal Plant
→ Regeneration Meal
```

Món ăn có buff ngắn hạn:

- Hunger recovery
- Stamina regeneration
- Swim speed
- Temperature resistance
- Health regeneration

---

# 18. WATER SYSTEM

Nguồn nước:

- rain
- coconut
- natural island water
- ocean water

Ocean water phải xử lý trước khi uống.

Machines:

```text
Basic Collector
→ Water Collector
→ Purifier
→ Desalinator
→ Advanced Desalinator
```

---

# 19. BUILDING SYSTEM

Dùng grid.

Building pieces:

```text
Floor
Half Floor
Wall
Window
Door
Roof
Stairs
Ladder
Foundation
Pillar
Railing
Storage
```

Mỗi piece có:

```text
Health
Material
Weight
BuildCost
Tier
```

---

# 20. RAFT TIER

## Tier 1 — Wooden Raft

- gỗ
- mái che
- storage
- grill

## Tier 2 — Reinforced Raft

- metal reinforcement
- larger storage
- water systems

## Tier 3 — Industrial Raft

- engine
- generator
- workshop
- navigation

## Tier 4 — Floating Ship

- multiple floors
- engine room
- bridge
- advanced farming
- laboratory

## Tier 5 — Ocean Platform

- advanced power
- underwater dock
- drone station
- abyss equipment

---

# 21. RAFT PHYSICS

Bè phải:

- nổi
- chịu ảnh hưởng sóng
- có inertia
- có damage
- có engine force
- có wind/sail force

Không mô phỏng vật lý từng plank ở MVP.

Dùng:

```text
RaftRoot
├── Grid
├── Collider
├── Buoyancy Controller
├── Movement Controller
└── Damage Controller
```

---

# 22. OCEAN

Ocean có:

- waves
- currents
- weather
- fog
- day/night
- underwater depth
- biome zones

MVP không cần mô phỏng đại dương vật lý thực tế. Ưu tiên gameplay và performance.

---

# 23. WEATHER

Weather states:

```text
Clear
Cloudy
Rain
Heavy Rain
Windy
Storm
Fog
Extreme Storm
```

Storm ảnh hưởng:

- wave height
- raft movement
- visibility
- engine efficiency
- building damage
- creature spawn

Storm không được phá sạch căn cứ nếu người chơi offline.

---

# 24. DAY / NIGHT

```text
06:00 Sunrise
08:00 Day
17:00 Sunset
19:00 Night
00:00 Deep Night
```

Night:

- visibility thấp
- một số sinh vật xuất hiện
- một số resource phát sáng
- nguy hiểm hơn nhưng có reward tốt hơn.

---

# 25. WORLD GENERATION

World dùng Seed.

```text
WorldSeed
↓
Ocean Generator
↓
Biome Generator
↓
Island Generator
↓
POI Generator
↓
Loot Generator
↓
Creature Spawn
```

Seed phải reproducible.

Cùng seed + cùng version generator → cùng world.

---

# 26. BIOMES

## 1. Calm Sea

Starter.

## 2. Tropical Sea

Nhiều đảo, thực vật.

## 3. Storm Sea

Thời tiết xấu.

## 4. Cold Sea

Nhiệt độ thấp.

## 5. Deep Sea

Sinh vật nguy hiểm.

## 6. Abyss

Late game.

---

# 27. ISLAND TYPES

### Small Island

- wood
- fiber
- food
- stone

### Tropical Island

- forest
- wildlife
- cave

### Rocky Island

- ore
- cave
- cliffs

### Abandoned Island

- buildings
- loot
- story

### Research Island

- laboratory
- blueprint
- technology

### Mysterious Island

- puzzle
- ancient artifact
- story progression

---

# 28. OCEAN POI

- Floating Cargo
- Small Wreck
- Cargo Ship
- Research Vessel
- Oil Platform
- Abandoned Yacht
- Lighthouse
- Floating Container
- Underwater Ruins
- Sunken City
- Ancient Gate
- Ocean Rift

---

# 29. DIVING

Depth:

```text
0–20m   Safe
20–50m  Shallow Deep
50–100m Deep
100–200m Abyss
200m+   Extreme
```

Depth ảnh hưởng:

- oxygen
- pressure
- visibility
- creature spawn
- loot rarity

Pressure damage chỉ áp dụng nếu không có đúng equipment.

---

# 30. SEA CREATURES

## Passive

- small fish
- turtle
- dolphin
- manta ray

## Neutral

- crab
- large fish
- seal

## Hostile

- shark
- barracuda
- giant squid
- sea crocodile

## Rare

- deep shark
- abyss eel

## Boss

### Leviathan

Phases:

```text
Phase 1
→ attacks raft

Phase 2
→ dives

Phase 3
→ destroys systems

Phase 4
→ exposes weak point

Phase 5
→ final encounter
```

Boss phải có telegraph rõ ràng, không one-shot ngẫu nhiên.

---

# 31. CREATURE AI

State Machine:

```text
Idle
Patrol
Investigate
Chase
Attack
Retreat
Flee
Dead
```

Perception:

- distance
- line of sight
- sound
- player state
- raft activity

Không dùng AI nặng cho toàn bộ ocean.

Dùng spawn manager + distance-based activation.

---

# 32. FISHING

Fishing types:

- hand fishing
- rod
- net
- trap

Fish có:

```text
Species
Rarity
Size
Weight
Biome
Time
WeatherPreference
```

Rare fish có thể dùng làm:

- food
- quest
- cooking
- trade
- research

---

# 33. SCANNER

Scanner là mechanic định hướng exploration.

Scan result:

```text
Resource
POI
Creature
Signal
Wreck
Island
Unknown
```

Ví dụ:

```text
UNKNOWN SIGNAL
Distance: 842m
Depth: 72m
Threat: Unknown
```

Scanner upgrade:

```text
Basic Scanner
→ Long Range Scanner
→ Deep Scanner
→ Quantum Scanner
```

---

# 34. QUEST SYSTEM

Quest categories:

```text
Survival
Exploration
Crafting
Research
Story
Boss
Discovery
```

Quest data:

```text
QuestId
Title
Description
Objectives[]
Rewards[]
Prerequisites[]
```

Objective types:

```text
Collect
Craft
Build
Visit
Kill
Scan
Dive
Retrieve
Interact
Survive
```

---

# 35. STORY

Story premise:

Một hệ thống vệ tinh đại dương đã phát hiện một tín hiệu lặp lại từ dưới đáy biển.

Những người sống sót trước đây đã cố gắng tìm nguồn tín hiệu.

Người chơi thu thập:

```text
Audio Log
Research Note
Coordinates
Artifact
Data Core
```

Các mảnh ghép dẫn tới một nền văn minh cổ đại và một hệ thống dưới đáy đại dương có liên quan tới sự thay đổi bất thường của biển.

Không giải thích tất cả ngay từ đầu.

---

# 36. STORY CHAPTERS

```text
Chapter 1 — Alone
↓
Chapter 2 — Signals
↓
Chapter 3 — Lost Ships
↓
Chapter 4 — The Research Network
↓
Chapter 5 — The Deep
↓
Chapter 6 — The Abyss
↓
Chapter 7 — Leviathan
↓
Chapter 8 — The Choice
```

---

# 37. ENDGAME CHOICES

Sau khi hoàn thành hệ thống chính:

### Ending A

Repair emergency transmitter.

### Ending B

Build a long-range ship.

### Ending C

Enter the Abyss.

### Ending D

Discover the ancient system.

Mỗi ending có epilogue khác nhau.

---

# 38. TRADING

NPC hoặc floating trading station.

Trade:

```text
Fish
Food
Rare Resources
Artifacts
Scrap
```

Đổi:

```text
Blueprint
Rare Material
Seed
Cosmetic
Special Tool
```

Không bán power quá mạnh để tránh phá progression.

---

# 39. NPC

MVP:

- Survivor
- Trader
- Researcher

NPC có:

```text
Name
Dialogue
Location
Quest
Trade
Relationship
```

Không cần hệ thống relationship phức tạp ở MVP.

---

# 40. SAVE SYSTEM

Save:

```text
WorldSeed
WorldVersion
Player
Inventory
Equipment
Stats
Raft
BuildingState
Machines
Containers
QuestState
Blueprints
DiscoveredPOI
Time
Weather
NPCState
```

Save format ưu tiên JSON cho prototype.

Sau khi ổn định có thể chuyển sang binary/database tùy nhu cầu.

Có:

- Auto Save
- Manual Save
- Backup Save

---

# 41. MULTIPLAYER — PHASE 2

Mục tiêu:

```text
1–4 Players
```

Authority:

- Server authoritative cho inventory, damage, crafting và world state.
- Client prediction cho movement khi phù hợp.

Sync:

```text
Player
Raft
Building
Inventory
Creature
Machine
Quest
World Events
```

Không làm multiplayer trong Sprint 1.

---

# 42. UI

HUD:

```text
Health
Hunger
Thirst
Stamina
Oxygen
Hotbar
Compass
Interaction Prompt
Quest Notification
```

Menu:

```text
Inventory
Crafting
Blueprint
Building
Map
Quest
Research
Settings
```

UI phải rõ, ít che màn hình.

---

# 43. AUDIO

Layers:

```text
Ocean Ambient
Wind
Rain
Storm
Wood Creak
Building
Crafting
Creature
Combat
UI
Music
Story
```

Âm thanh phải thay đổi theo biome và weather.

---

# 44. PERFORMANCE

Mục tiêu MVP:

- 60 FPS trên PC gaming phổ thông.
- Không spawn hàng nghìn object physics.
- Object pooling cho debris, fish và effects.
- LOD cho island.
- Distance culling.
- GPU instancing cho vegetation.
- Không dùng Update() vô hạn cho mọi object nếu có thể event-driven.

---

# 45. PROJECT STRUCTURE

```text
Assets/
├── Art/
├── Audio/
├── Materials/
├── Prefabs/
├── Scenes/
├── ScriptableObjects/
├── UI/
├── Animations/
├── VFX/
└── Scripts/
    ├── Core/
    ├── Player/
    ├── Inventory/
    ├── Items/
    ├── Crafting/
    ├── Building/
    ├── Machines/
    ├── Survival/
    ├── World/
    ├── Ocean/
    ├── Weather/
    ├── Creatures/
    ├── Diving/
    ├── Fishing/
    ├── Cooking/
    ├── Quests/
    ├── Story/
    ├── Save/
    ├── UI/
    └── Multiplayer/
```

---

# 46. SCRIPTABLE OBJECTS

Tối thiểu:

```text
ItemData
RecipeData
BlueprintData
BuildingData
CreatureData
BiomeData
LootTableData
QuestData
DialogueData
TechnologyData
CookingRecipeData
EquipmentData
WeaponData
```

Không hard-code recipe vào MonoBehaviour.

---

# 47. ITEM DATA EXAMPLE

```json
{
  "id": "iron_ingot",
  "name": "Iron Ingot",
  "category": "Material",
  "tier": 2,
  "maxStack": 50,
  "weight": 1.2,
  "tags": ["Metal", "Processed"]
}
```

---

# 48. RECIPE DATA EXAMPLE

```json
{
  "id": "circuit_board",
  "station": "Workbench",
  "inputs": [
    {"item": "copper_wire", "amount": 2},
    {"item": "resin", "amount": 1},
    {"item": "refined_glass", "amount": 1},
    {"item": "metal_plate", "amount": 1}
  ],
  "outputs": [
    {"item": "circuit_board", "amount": 1}
  ],
  "craftTime": 5,
  "requiredTechnology": "basic_electronics"
}
```

---

# 49. COMBINATION ENGINE

Implement một `RecipeResolver`.

Input:

```text
Inventory
Station
Technology
Context
```

Output:

```text
AvailableRecipes
LockedRecipes
MissingMaterials
RequiredStation
RequiredTechnology
```

Không để UI tự tính recipe.

UI chỉ gọi:

```csharp
RecipeResolver.GetAvailableRecipes(...)
```

---

# 50. TAG-BASED CRAFTING

Recipe có thể yêu cầu:

```text
RequiredTags:
Metal >= 2
Electrical >= 1
```

Điều này cho phép tạo recipe mới mà không phải sửa nhiều code.

Ví dụ:

```text
Metal x2
Electrical x1
Energy x1
→ Powered Device
```

---

# 51. MACHINE SYSTEM

Mọi machine dùng interface chung:

```text
IMachine
```

Các trạng thái:

```text
Idle
InputReady
Processing
OutputReady
Blocked
Broken
NoPower
```

Machine:

- Furnace
- Purifier
- Grill
- Farm
- Battery Charger
- Smelter
- Workbench
- Research Table
- Generator
- Engine
- Refrigerator

---

# 52. POWER SYSTEM

Power sources:

```text
Battery
Solar Panel
Wind Generator
Fuel Generator
Advanced Reactor
```

Power consumers:

```text
Purifier
Scanner
Engine
Refrigerator
Research Station
Lighting
Advanced Machines
```

Mỗi machine có:

```text
PowerRequired
PowerPriority
```

Nếu thiếu điện:

```text
Low Priority
→ tắt trước

High Priority
→ duy trì
```

---

# 53. FUEL SYSTEM

Fuel:

```text
Biofuel
Diesel
Advanced Fuel
```

Engine có:

```text
FuelConsumption
Power
MaxSpeed
Acceleration
Noise
```

Noise có thể ảnh hưởng creature spawn.

---

# 54. BASE FUNCTIONALITY

Bè có thể chia thành khu:

```text
Living
Food
Water
Workshop
Storage
Engine
Research
Farm
Defense
Dock
```

Base rating:

```text
Comfort
Power
Storage
Production
Defense
Navigation
Research
```

Không bắt buộc phải có “base score”; có thể dùng nội bộ để unlock một số content.

---

# 55. DAMAGE SYSTEM

Damage types:

```text
Physical
Fire
Electric
Pressure
Poison
Cold
```

Armor resistance.

Ví dụ:

```text
Pressure Suit:
Pressure Resistance +80%

Insulated Suit:
Cold Resistance +60%

Reinforced Armor:
Physical Resistance +30%
```

---

# 56. STATUS EFFECTS

```text
Hungry
Dehydrated
Wet
Cold
Overheated
Bleeding
Poisoned
Exhausted
PressureStress
OxygenLow
```

Status effects phải có icon + description.

---

# 57. LOOT SYSTEM

Loot table:

```text
Common
Uncommon
Rare
Epic
Legendary
```

Loot phụ thuộc:

```text
Biome
POI
Depth
PlayerProgress
Difficulty
Quest
```

Không cho item endgame rơi ở starter zone.

---

# 58. DIFFICULTY

### Relaxed

- survival nhẹ
- creature ít
- resource nhiều

### Normal

Default.

### Hard

- resource ít
- weather nguy hiểm
- creature mạnh hơn

### Survival

- limited save
- survival khắc nghiệt

MVP chỉ cần Normal + Relaxed.

---

# 59. ACCESSIBILITY

- FOV
- sensitivity
- subtitles
- text size
- motion reduction
- color-independent icons
- volume sliders
- key rebinding

---

# 60. DEVELOPMENT MILESTONES

## MILESTONE 0 — FOUNDATION

- Unity project
- input
- scene
- Git
- folder structure
- basic player

## MILESTONE 1 — PLAYER

- movement
- camera
- interaction
- inventory
- hotbar

## MILESTONE 2 — OCEAN

- water
- raft
- floating objects
- day/night
- waves

## MILESTONE 3 — RESOURCES

- resource spawning
- collecting
- inventory stack
- tools

## MILESTONE 4 — CRAFTING

- recipe resolver
- workbench
- blueprint
- technology

## MILESTONE 5 — BUILDING

- grid
- floor
- wall
- storage
- machines

## MILESTONE 6 — SURVIVAL

- hunger
- thirst
- health
- stamina
- temperature

## MILESTONE 7 — WORLD

- islands
- POI
- procedural generation
- seed

## MILESTONE 8 — CREATURES

- fish
- shark
- AI
- combat

## MILESTONE 9 — DIVING

- underwater
- oxygen
- pressure
- diving equipment

## MILESTONE 10 — EXPLORATION

- scanner
- wrecks
- rare POI
- loot

## MILESTONE 11 — STORY

- quests
- logs
- dialogue
- chapters

## MILESTONE 12 — ADVANCED SYSTEMS

- power
- engine
- advanced crafting
- late-game zones

## MILESTONE 13 — BOSS

- Leviathan
- boss arena
- rewards
- story progression

## MILESTONE 14 — POLISH

- audio
- VFX
- animation
- optimization
- settings
- save backup

## MILESTONE 15 — MULTIPLAYER

Only start after single-player core is stable.

---

# 61. DEFINITION OF DONE

Một milestone chỉ được coi là hoàn thành khi:

1. Code compile không error.
2. Không có lỗi console nghiêm trọng.
3. Feature hoạt động từ UI đến gameplay.
4. Save/load không làm mất dữ liệu.
5. Có test case.
6. Không phá feature của milestone trước.
7. Không hard-code dữ liệu đáng lẽ phải nằm trong ScriptableObject.
8. Performance không giảm bất thường.
9. Có fallback khi thiếu asset.
10. Có README/update note.

---

# 62. TEST PLAN

## Inventory

- add item
- remove item
- stack
- split
- full inventory
- save/load

## Crafting

- enough material
- insufficient material
- wrong station
- locked blueprint
- craft queue
- output overflow

## Building

- valid placement
- invalid placement
- collision
- remove
- repair
- save/load

## Survival

- hunger
- thirst
- stamina
- oxygen
- death
- recovery

## World

- seed reproducibility
- island spawn
- POI spawn
- loot
- creature spawn

## Save

- save
- reload
- autosave
- corrupted save fallback

---

# 63. CODING RULES FOR CODEX

Codex phải:

- Không rewrite toàn bộ project khi chỉ sửa một feature.
- Không xóa code đang hoạt động nếu chưa có lý do.
- Không tạo duplicate manager.
- Không tạo Singleton vô tội vạ.
- Không hard-code item ID rải rác.
- Không hard-code recipe trong UI.
- Không dùng Resources.FindObjectsOfTypeAll để chạy liên tục.
- Hạn chế FindObjectOfType trong runtime loop.
- Dùng dependency rõ ràng.
- Dùng event cho UI khi phù hợp.
- Dùng object pooling cho object spawn nhiều.
- Comment những phần có logic phức tạp.
- Mỗi milestone phải build được.

---

# 64. ARCHITECTURE

Core services:

```text
GameManager
SaveManager
WorldManager
InventoryManager
CraftingManager
BuildingManager
QuestManager
AudioManager
UIManager
TimeManager
WeatherManager
```

Không để PlayerController xử lý:

- crafting
- saving
- weather
- quest
- world generation

Player chỉ nên điều phối input/player state.

---

# 65. EVENTS

Các event quan trọng:

```text
OnItemAdded
OnItemRemoved
OnInventoryChanged
OnRecipeCrafted
OnBlueprintUnlocked
OnBuildingPlaced
OnBuildingDestroyed
OnQuestCompleted
OnPlayerDamaged
OnPlayerDied
OnWeatherChanged
OnDayChanged
OnPOIDiscovered
OnCreatureSpawned
OnStoryProgressed
```

---

# 66. SAVE VERSIONING

Save có:

```text
saveVersion
gameVersion
worldSeed
```

Nếu schema thay đổi:

```text
SaveMigrationService
```

Không được để update game mới làm hỏng save cũ mà không có migration/fallback.

---

# 67. MVP SCOPE

MVP chỉ cần:

### Player

- movement
- inventory
- health
- hunger
- thirst

### Resource

- wood
- plastic
- fiber
- stone
- scrap

### Crafting

- rope
- plank
- hook
- spear
- storage
- grill
- purifier

### Building

- floor
- wall
- storage
- purifier
- grill

### World

- ocean
- 3 island types
- floating debris
- day/night

### Creature

- fish
- shark

### Exploration

- 1 wreck
- 1 cave

### Save

- player
- inventory
- raft
- world seed

---

# 68. POST-MVP

Sau MVP mới thêm:

- procedural world nâng cao
- weather
- diving
- power
- engines
- NPC
- trading
- story
- bosses
- multiplayer

---

# 69. GAME BALANCE PRINCIPLES

1. Người chơi luôn có cách kiếm nước.
2. Người chơi luôn có cách kiếm thức ăn.
3. Không để random event phá sạch tiến trình.
4. Rare item phải có giá trị nhưng không bắt buộc quá sớm.
5. Crafting nâng cấp phải tạo cảm giác khác biệt.
6. Mỗi tier phải mở gameplay mới, không chỉ tăng damage.
7. Khám phá phải có reward.
8. Rủi ro cao phải có reward cao.
9. Không ép người chơi phải farm nhàm chán quá lâu.
10. Late game phải thay đổi cách chơi.

---

# 70. ROADMAP CONTENT

```text
EARLY GAME
Wood
Plastic
Fiber
Stone
Water
Food
Basic Raft

MID GAME
Metal
Furnace
Farm
Better Tools
Islands
Wrecks
Shark
Scanner

LATE MID GAME
Steel
Electronics
Engine
Power
Diving
Research
Deep Ocean

LATE GAME
Advanced Machines
Abyss
Ancient Technology
Leviathan
Story Finale

ENDGAME
Multiple Endings
Free Exploration
Rare Loot
Base Expansion
Optional Challenges
```

---

# 71. THỨ TỰ CODE THỰC TẾ

Codex phải triển khai theo thứ tự:

```text
01 Project Foundation
02 Input
03 Player
04 Interaction
05 Item Data
06 Inventory
07 Resource Nodes
08 Crafting
09 Building
10 Raft
11 Survival
12 Ocean
13 Day Night
14 Save
15 Island
16 POI
17 Creature
18 Combat
19 Fishing
20 Cooking
21 Diving
22 Scanner
23 Weather
24 Power
25 Engine
26 Quest
27 Story
28 NPC
29 Boss
30 Polish
31 Multiplayer
```

Không được nhảy thẳng vào multiplayer trước khi core systems ổn định.

---

# 72. CODEX EXECUTION FORMAT

Mỗi lần nhận milestone:

1. Đọc toàn bộ project.
2. Xác định architecture hiện tại.
3. Kiểm tra compile errors.
4. Liệt kê files sẽ tạo/sửa.
5. Implement.
6. Test.
7. Fix compile/runtime errors.
8. Chạy test.
9. Báo cáo:
   - Files changed
   - Features added
   - Tests
   - Known issues
   - Next milestone

Không tuyên bố “hoàn thành” nếu project chưa compile.

---

# 73. FIRST TASK FOR CODEX

Bắt đầu bằng MILESTONE 0.

Phải tạo:

```text
Unity project structure
Core
Player
Input
Basic Scene
Basic Ocean Placeholder
Basic Raft Placeholder
UI Debug
Git-ready structure
README
```

Sau đó compile.

Chưa triển khai:

- multiplayer
- procedural world
- boss
- advanced crafting
- story

Cho tới khi foundation ổn định.

---

# 74. FINAL DESIGN PRINCIPLE

Oceanbound phải tạo cảm giác:

```text
Ngày 1
“Mình phải sống.”

↓
Ngày 5
“Mình cần một cái bè tốt hơn.”

↓
Ngày 15
“Mình muốn tìm hòn đảo kia.”

↓
Ngày 30
“Mình cần engine.”

↓
Ngày 60
“Mình muốn biết tín hiệu kia là gì.”

↓
Ngày 100
“Mình phải xuống đáy biển.”

↓
Endgame
“Bây giờ mình mới hiểu chuyện gì đã xảy ra.”
```

**Ưu tiên cảm giác tiến bộ, khám phá và tự do.**

Game không được biến thành một danh sách nhiệm vụ farm tài nguyên.

---

# 75. ACCEPTANCE CRITERIA TOÀN GAME

Game hoàn chỉnh khi người chơi có thể:

- bắt đầu với bè nhỏ;
- thu thập tài nguyên;
- chế tạo công cụ;
- ăn/uống;
- mở rộng bè;
- xây machine;
- khám phá đảo;
- khám phá xác tàu;
- chiến đấu với sinh vật;
- câu cá;
- trồng cây;
- nấu ăn;
- lặn;
- dùng scanner;
- nâng cấp công nghệ;
- vận hành engine;
- khám phá biển sâu;
- hoàn thành story;
- đánh boss;
- đạt ít nhất một ending;
- lưu và tải game ổn định.

---

# 76. IMPORTANT: DEVELOPMENT PHILOSOPHY

Đây là một project lớn.

Không cố làm toàn bộ cùng lúc.

Thứ tự đúng là:

```text
PLAYABLE
↓
STABLE
↓
FUN
↓
CONTENT
↓
POLISH
↓
MULTIPLAYER
```

Một prototype nhỏ nhưng chơi được tốt quan trọng hơn một project có 200 class nhưng không chạy ổn định.

---

# END OF MASTER SPECIFICATION


# 77. EXPANDED WORLD DESIGN — LIVING ISLANDS

Đảo không phải object tĩnh để người chơi chỉ ghé qua lấy tài nguyên.

Mỗi đảo phải có:

```text
IslandId
Seed
Biome
Climate
Size
Elevation
WaterSources
Vegetation
Animals
Resources
Buildings
POIs
Threats
NPCs
FactionPresence
WeatherExposure
Discovered
PlayerModified
PersistentState
```

Mỗi đảo có thể thay đổi theo thời gian.

Ví dụ:

```text
Đảo A
Ngày 1:
- Rừng
- Một căn nhà bỏ hoang
- Một giếng nước

Ngày 20:
- Người chơi xây nhà
- Trồng cây
- Đặt kho
- Xây cầu cảng

Ngày 50:
- Một faction phát hiện căn cứ
- Xuất hiện patrol
- Người chơi xây tháp phòng thủ

Ngày 80:
- Bão lớn phá một phần cầu cảng
- Người chơi sửa chữa

Ngày 120:
- Người chơi xây trạm liên lạc
- Đảo trở thành căn cứ phụ
```

Đảo phải lưu state riêng trong save.

---

# 78. ISLAND CLAIM SYSTEM

Người chơi có thể "claim" một khu vực trên đảo.

Các bước:

```text
Explore Island
↓
Find Suitable Area
↓
Place Claim Beacon
↓
Scan Territory
↓
Claim Area
↓
Build
↓
Register Base
```

Claim Beacon cần:

```text
Metal Plate
Copper Wire
Battery
Circuit Board
Navigation Component
```

Một claim có:

```text
ClaimId
IslandId
Position
Radius
OwnerId
BaseLevel
Power
Defense
Storage
Buildings
```

Claim radius ban đầu nhỏ.

Có thể nâng cấp:

```text
Small Claim
→ Medium Claim
→ Large Claim
→ Island Base
```

Không cho claim toàn đảo ngay lập tức.

---

# 79. ISLAND BASE SYSTEM

Người chơi có thể xây căn cứ trên đảo giống xây trên bè.

Có:

```text
Foundation
Floor
Wall
Window
Door
Roof
Stair
Fence
Gate
Bridge
Dock
Tower
Warehouse
Workshop
Farm
Generator Room
Water Room
Research Room
Bedroom
Kitchen
Garage
```

Căn nhà hoàn toàn có thể xây từ đầu.

Ví dụ:

```text
Foundation
↓
Floor
↓
Wall
↓
Door
↓
Window
↓
Roof
↓
Furniture
↓
Electricity
↓
Water
↓
Storage
```

---

# 80. HOUSE BUILDING SYSTEM

Building mode có 4 chế độ:

```text
Foundation
Structure
Furniture
Decoration
```

## Foundation

- Wood Foundation
- Stone Foundation
- Metal Foundation
- Reinforced Foundation

## Structure

- Wall
- Half Wall
- Corner
- Pillar
- Beam
- Window
- Door
- Roof
- Stairs
- Ladder

## Furniture

- Bed
- Chair
- Table
- Cabinet
- Chest
- Shelf
- Workbench
- Cooking Station
- Research Desk

## Decoration

- Lamp
- Flag
- Painting
- Plant
- Carpet
- Sign
- Clock
- Lantern

---

# 81. BUILDING CONNECTION SYSTEM

Mỗi building piece có socket.

Ví dụ:

```text
Floor
├── Wall Socket
├── Pillar Socket
├── Stairs Socket
└── Furniture Socket
```

Khi đưa object gần socket:

```text
Snap
↓
Validate
↓
Green Preview
↓
Place
```

Nếu không hợp lệ:

```text
Red Preview
↓
Show Reason
```

Ví dụ:

> Cannot build: missing foundation.

---

# 82. MULTI-FLOOR HOUSE

Cho phép:

```text
Ground Floor
      ↓
Second Floor
      ↓
Third Floor
      ↓
Roof
```

Có thể xây:

- nhà 1 tầng
- nhà 2 tầng
- tháp canh
- kho
- biệt thự
- nhà gỗ
- bunker
- research base

Giới hạn chiều cao phụ thuộc stability.

---

# 83. STRUCTURAL STABILITY

Mỗi building có:

```text
SupportValue
Weight
Integrity
```

Nếu xây quá xa foundation:

```text
Support ↓
↓
Warning
↓
Building unstable
```

Nhưng không nên làm hệ thống quá khó chịu.

MVP:

```text
Foundation → Floor → Wall/Roof
```

Late game mới bật simulation chi tiết.

---

# 84. HOUSE UTILITIES

Nhà có thể có:

### Điện

```text
Generator
↓
Cable
↓
Battery
↓
Lights / Machines
```

### Nước

```text
Water Collector
↓
Pipe
↓
Tank
↓
House Sink
```

### Nhiệt

```text
Fireplace
Heater
```

### Food

```text
Kitchen
Refrigerator
Storage
Cooking Station
```

### Security

```text
Door Lock
Alarm
Camera
Turret
Wall
Fence
```

---

# 85. ISLAND INFRASTRUCTURE

Khi người chơi phát triển đảo, có thể xây:

```text
Dock
Road
Bridge
Watch Tower
Water Tank
Power Grid
Warehouse
Farm
Greenhouse
Workshop
Radio Tower
Radar
Research Station
Defense Wall
Gate
```

Từ một đảo hoang có thể biến thành:

```text
🏝️ Survivor Settlement
```

---

# 86. ISLAND DEVELOPMENT LEVEL

Mỗi đảo có Development Level:

```text
Level 0 — Wild
Level 1 — Camp
Level 2 — Outpost
Level 3 — Settlement
Level 4 — Stronghold
Level 5 — Major Base
```

Level tăng dựa trên:

```text
Buildings
Power
Water
Storage
Food
Defense
Communication
Population/NPC
```

Không cần tăng level chỉ vì đặt thật nhiều object.

---

# 87. ISLAND PERSISTENCE

Nếu người chơi rời đảo:

```text
Save Island State
```

Khi quay lại:

- nhà vẫn còn;
- cây đã lớn;
- machine vẫn hoạt động nếu có power;
- kho vẫn chứa item;
- NPC vẫn ở đó;
- damage vẫn tồn tại;
- faction có thể đã chiếm một khu vực;
- thời tiết có thể đã thay đổi địa hình ở mức cho phép.

Không regenerate island từ đầu.

---

# 88. ISLAND EVENTS

Mỗi đảo có Event Manager.

Events:

```text
Storm
Flood
Fire
Wildlife Attack
Pirate Raid
Faction Attack
Resource Discovery
NPC Arrival
Supply Drop
Disease/Plant Problem
Earthquake
Tsunami
```

Event phải có:

```text
EventId
IslandId
StartTime
Duration
Severity
Cause
Consequences
Resolution
```

---

# 89. FACTION SYSTEM — THẾ LỰC

Đại dương không chỉ có quái vật.

Có các thế lực.

## Faction 1 — Driftborn

Nhóm sinh tồn lang thang.

Đặc điểm:

- giao thương
- trao đổi
- tìm kiếm người sống sót
- ít thù địch

Có thể trở thành đồng minh.

---

## Faction 2 — Iron Tide

Một nhóm quân sự chiếm các căn cứ trên biển.

Đặc điểm:

- tàu tuần tra
- vũ khí
- radar
- chiếm tài nguyên
- bảo vệ lãnh địa

Có thể:

```text
Trade
Neutral
Hostile
```

---

## Faction 3 — Deep Cult

Một tổ chức bí ẩn tin rằng vực sâu là "nguồn sống".

Đặc điểm:

- căn cứ dưới biển
- nghi lễ
- công nghệ lạ
- sử dụng sinh vật biển
- hostile nếu người chơi xâm nhập

---

## Faction 4 — Salvagers

Nhóm chuyên săn xác tàu.

Không nhất thiết hostile.

Có thể:

- cạnh tranh loot
- thuê người chơi
- bán blueprint
- tranh chấp POI

---

## Faction 5 — Abyssal

Không hoàn toàn là con người.

Một hệ thống/cộng đồng sống trong vùng biển sâu.

Có:

- công nghệ cổ
- sinh vật biến đổi
- structure dưới đáy biển

Không biết người chơi là kẻ thù hay đồng minh.

---

# 90. FACTION RELATIONSHIP

Mỗi faction có reputation:

```text
-100 Hostile
-50 Enemy
0 Neutral
25 Friendly
50 Ally
100 Trusted
```

Hành động ảnh hưởng reputation:

```text
Trade
Complete Quest
Attack Members
Destroy Base
Steal Resource
Rescue Member
Protect Convoy
Discover Artifact
```

---

# 91. FACTION TERRITORY

Map có thể hiển thị:

```text
Blue = Friendly
Yellow = Neutral
Red = Hostile
Purple = Unknown
Black = Abyss
```

Territory có:

- patrol
- base
- resource
- ships
- towers
- underwater installations

---

# 92. FACTION RAID

Nếu người chơi xây căn cứ quan trọng:

```text
Faction detects base
↓
Recon
↓
Warning
↓
Attack
```

Raid scale:

```text
Small
Medium
Large
Siege
```

Defense:

```text
Wall
Gate
Watch Tower
Alarm
Turret
Trap
NPC Guard
Player Weapon
```

Không tự động raid quá thường xuyên.

---

# 93. UNDERWATER FACTIONS

Vùng biển sâu có các structure:

```text
Underwater Camp
Research Dome
Submarine Dock
Ancient Temple
Abyss Gate
Deep Mining Station
```

Người chơi có thể:

- lén vào;
- chiến đấu;
- giao dịch;
- lấy quest;
- phá hoại;
- liên minh.

---

# 94. NATURAL DISASTER SYSTEM

Thiên tai là hệ thống dynamic event.

## Storm

Ảnh hưởng:

- wave
- wind
- visibility
- building damage
- navigation
- electricity

Chuẩn bị:

```text
Reinforced Foundation
Anchor
Shutters
Battery Backup
Emergency Water
Emergency Food
```

---

# 95. HURRICANE

Trước khi xảy ra:

```text
Weather Warning
↓
Pressure Drop
↓
Wind Increase
↓
Storm
↓
Hurricane
```

Người chơi có thời gian chuẩn bị.

Cách sống sót:

```text
Anchor Raft
Reinforce Building
Store Loose Objects
Close Doors
Backup Power
Move Boat Indoors/Protected Area
```

---

# 96. TSUNAMI

Tsunami không nên xuất hiện vô lý.

Trigger:

```text
Underwater Earthquake
↓
Ocean Warning
↓
Tsunami
```

Cách chống:

- xây nhà cao;
- xây trên vách đá;
- evacuation route;
- emergency boat;
- flood barrier;
- elevated storage.

Đảo thấp có thể bị ngập tạm thời.

Không xóa toàn bộ base.

---

# 97. TYPHOON

Typhoon có nhiều phase:

```text
Approach
↓
Rain
↓
Strong Wind
↓
Extreme Wind
↓
Eye
↓
Second Wind
↓
End
```

Eye có thể là thời gian ngắn để:

- repair;
- move;
- rescue;
- reposition.

---

# 98. FOG

Fog giảm:

- vision
- scanner range
- navigation

Một số sinh vật nguy hiểm hơn.

Counter:

```text
Radar
Scanner
Beacon
Flare
Navigation System
```

---

# 99. LIGHTNING STORM

Có nguy cơ đánh vào:

- mast
- tower
- exposed machine

Counter:

```text
Lightning Rod
Grounding System
Surge Protector
```

Lightning Rod có thể bảo vệ bán kính nhất định.

---

# 100. UNDERWATER EARTHQUAKE

Có thể:

- thay đổi một số underwater POI;
- mở cave;
- làm lộ resource;
- tạo tsunami;
- đánh thức creature;
- thay đổi route.

Không phá procedural seed gốc. Chỉ thay đổi persistent world state.

---

# 101. VOLCANIC ISLAND

Late game có đảo núi lửa.

Threats:

- lava zone
- ash
- toxic gas
- earthquake

Equipment:

```text
Heat Suit
Gas Mask
Fire Resistant Boots
```

Reward:

- rare minerals
- obsidian
- geothermal component
- rare artifact

---

# 102. DISASTER PREPARATION SYSTEM

Người chơi có thể xây:

```text
Weather Station
Storm Alarm
Emergency Beacon
Flood Barrier
Lightning Rod
Emergency Generator
Emergency Storage
Shelter
Radio Tower
Radar
```

Khi weather event tới:

```text
Weather Station
→ predicts event
→ gives preparation time
```

Đây tạo gameplay:

> Xây dựng căn cứ tốt giúp người chơi sống sót.

---

# 103. MAP SYSTEM

Map phải persistent.

Có:

```text
Ocean
Island
Player Position
Raft
Bases
POI
Markers
Faction Territory
Quest
Weather
Depth
Discovered Areas
```

Map fog-of-war:

```text
Unknown
↓
Scouted
↓
Discovered
↓
Mapped
```

---

# 104. PLAYER MAP MARKERS

Người chơi có thể đánh dấu điểm.

Marker types:

```text
📍 Custom
🏝️ Island
🚢 Wreck
⚠️ Danger
⛏️ Resource
🏠 Base
🛒 Trader
📡 Signal
🤿 Dive Site
👹 Boss
🧭 Quest
```

Có:

```text
Name
Icon
Color
Note
Coordinates
Depth
CreatedBy
Timestamp
```

Ví dụ:

```text
📍 “Kho sắt”
Lat: ...
Lon: ...
Note:
“Có khoảng 20 quặng sắt.
Quay lại sau.”
```

---

# 105. MAP PINS PERSISTENCE

Marker phải lưu:

```text
MarkerId
WorldId
Position
Type
Title
Description
Color
Icon
CreatedAt
UpdatedAt
```

Khi save/load vẫn còn.

---

# 106. WAYPOINT SYSTEM

Người chơi chọn marker:

```text
Set Waypoint
↓
Compass shows direction
↓
Distance updates
↓
ETA optional
```

Có thể nâng cấp:

```text
Basic Compass
→ Navigation Compass
→ GPS
→ Satellite Navigation
```

---

# 107. DISCOVERY MAP

Khi scan/visit POI:

```text
Unknown
↓
Discovered
↓
Scanned
↓
Completed
```

Ví dụ:

```text
🚢 Cargo Wreck
Status:
Discovered
Loot:
70%
Quest:
Completed
```

---

# 108. MAP NOTES

Cho phép ghi chú tự do.

Ví dụ:

> “Shark spawn ở đây.”

> “Có cave dưới nước.”

> “Cần quay lại khi có diving tank.”

> “Faction patrol.”

Đây là tính năng nhỏ nhưng tăng cảm giác khám phá rất mạnh.

---

# 109. BASE TELEPORTATION / FAST TRAVEL

Không cho teleport miễn phí ngay từ đầu.

Unlock bằng:

```text
Radio Tower
+
Navigation Beacon
+
Power
```

Khi có hai base:

```text
Base A
↓
Network
↓
Base B
```

Fast travel yêu cầu:

- beacon online;
- đủ power;
- không trong combat;
- không trong storm cực mạnh.

---

# 110. OUTPOST NETWORK

Người chơi có thể xây nhiều outpost.

Ví dụ:

```text
Main Base
    │
    ├── Tropical Outpost
    ├── Mining Outpost
    ├── Research Outpost
    ├── Deep Sea Station
    └── Volcano Outpost
```

Mỗi outpost có mục đích.

---

# 111. RESOURCE LOGISTICS

Late game có:

```text
Storage
↓
Conveyor
↓
Processor
↓
Storage
```

Hoặc:

```text
Boat
↓
Cargo
↓
Base
```

Có thể xây:

- Cargo Container
- Crane
- Conveyor
- Pipe
- Power Cable
- Resource Terminal

Không cần automation quá sớm.

---

# 112. CARGO SHIP SYSTEM

Late game người chơi có thể xây tàu chở hàng.

Cargo ship:

```text
Hull
Engine
Fuel
Navigation
Cargo
Bridge
```

Dùng để:

- vận chuyển tài nguyên;
- di chuyển giữa base;
- rescue NPC;
- trade;
- expedition.

---

# 113. SUBMARINE SYSTEM

Late game có thể craft submarine.

Components:

```text
Hull
Pressure Chamber
Oxygen
Battery
Motor
Navigation
Sonar
```

Submarine có:

- depth limit;
- battery;
- oxygen;
- sonar;
- storage;
- docking.

Submarine mở gameplay mới thay vì chỉ là vehicle nhanh hơn.

---

# 114. UNDERWATER BASE

Người chơi có thể xây:

```text
Underwater Foundation
Glass Dome
Pressure Door
Airlock
Oxygen Generator
Water Pump
Power Generator
Docking Bay
Research Lab
Storage
```

Có thể xây ở:

```text
20m
50m
100m+
```

phụ thuộc technology.

---

# 115. UNDERWATER BASE PRESSURE

Mỗi module có:

```text
PressureRating
StructuralIntegrity
OxygenSeal
```

Nếu vượt giới hạn:

```text
Warning
↓
Stress
↓
Leak
↓
Emergency Repair
```

Không instant death.

---

# 116. BREACH SYSTEM

Nếu module bị hỏng:

```text
Air Leak
↓
Oxygen loss
↓
Alarm
↓
Player repairs
```

Repair Tool có:

```text
Scrap
Metal
Sealant
```

---

# 117. REPAIR SYSTEM

Mọi machine/building có:

```text
Durability
MaxDurability
DamageState
RepairCost
```

States:

```text
100–70 Healthy
70–40 Damaged
40–10 Critical
<10 Broken
```

Broken machine không hoạt động.

---

# 118. BLUEPRINT DISCOVERY

Blueprint có thể tìm từ:

```text
Island
Wreck
Faction
Quest
Research
Boss
Abyss
```

Một blueprint có thể có nhiều cấp:

```text
Blueprint: Water Purifier

Mk I
Mk II
Mk III
```

---

# 119. MODULAR EQUIPMENT

Một số equipment có module slots.

Ví dụ Scanner:

```text
Scanner
├── Range Module
├── Battery Module
├── Deep Scan Module
└── Threat Detection Module
```

Engine:

```text
Engine
├── Efficiency Module
├── Speed Module
├── Durability Module
└── Silent Module
```

Oxygen Tank:

```text
Tank
├── Capacity Module
├── Recharge Module
└── Lightweight Module
```

---

# 120. CRAFTING COMPONENT GRAPH

Thiết kế item dependency graph:

```text
Iron Ore
 ↓
Iron Ingot
 ↓
Metal Plate
 ↓
Machine Frame
 ↓
Machine
```

Ví dụ:

```text
Copper Ore
 ↓
Copper Ingot
 ↓
Copper Wire
 ↓
Circuit Board
 ↓
Battery
 ↓
Scanner
```

Mục tiêu là người chơi hiểu:

> “Mình cần công nghệ nào để đi tới vật phẩm nào.”

---

# 121. ADVANCED COMBINATION EXAMPLES

## Deep Diving Set

```text
Metal Plate x6
+ Glass x2
+ Rubber/Sealant x3
+ Oxygen Tank x1
+ Copper Wire x2
→ Diving Helmet
```

## Advanced Scanner

```text
Basic Scanner
+ Circuit Board x3
+ Battery x2
+ Rare Crystal x1
+ Antenna x1
→ Advanced Scanner
```

## Storm Shelter

```text
Metal Plate x12
+ Steel x8
+ Concrete/Stone x20
+ Reinforced Door x1
+ Emergency Battery x2
→ Storm Shelter
```

## Radio Tower

```text
Steel x12
+ Copper Wire x15
+ Circuit Board x4
+ Battery x2
+ Antenna x1
→ Radio Tower
```

## Lightning Rod

```text
Copper Rod x2
+ Steel x4
+ Ground Cable x4
→ Lightning Rod
```

## Flood Barrier

```text
Stone x30
+ Metal Plate x8
+ Sealant x4
→ Flood Barrier Segment
```

---

# 122. ENVIRONMENTAL RESOURCE REGENERATION

Resources có regeneration rules.

Ví dụ:

```text
Wood
→ regrow after days

Fish
→ respawn by ecosystem

Ore
→ finite per deposit

Floating Debris
→ dynamic spawn

Rare Artifact
→ unique
```

Không infinite mine ở cùng một node.

---

# 123. ECOLOGY SYSTEM

Late game có ecosystem đơn giản:

```text
Small Fish
↓
Large Fish
↓
Shark
```

Nếu người chơi đánh bắt quá mức:

```text
Fish population ↓
Shark sightings ↓/move
```

Nếu bảo vệ khu vực:

```text
Fish population ↑
Rare fish chance ↑
```

MVP có thể bỏ qua simulation sâu.

---

# 124. DYNAMIC OCEAN EVENTS

Ngoài thiên tai:

```text
Whale Migration
Fish Swarm
Floating Cargo
Ghost Ship
SOS Signal
Supply Drop
Merchant Convoy
Pirate Convoy
Military Patrol
Research Expedition
Abyss Signal
```

Một số event chỉ xuất hiện trong điều kiện nhất định.

---

# 125. GHOST SHIP

Rare event.

Không phải horror bắt buộc.

Có:

- mysterious lights
- abandoned cargo
- strange signal
- log
- rare blueprint

Có thể là story clue.

---

# 126. DISTRESS SIGNAL

Người chơi nghe radio:

```text
SOS
Distance: 2.4km
```

Có thể:

- cứu người;
- tìm loot;
- gặp trap;
- gặp faction;
- mở quest.

Không phải signal nào cũng tốt.

---

# 127. EXPEDITION SYSTEM

Người chơi có thể lập expedition:

```text
Choose Destination
↓
Choose Crew
↓
Choose Supplies
↓
Choose Equipment
↓
Depart
↓
Event
↓
Return
```

Late game có thể gửi NPC thay vì tự đi.

---

# 128. NPC BASE JOBS

NPC có thể được phân công:

```text
Farmer
Cook
Engineer
Guard
Researcher
Fisher
Trader
Medic
```

Mỗi NPC có skill đơn giản.

Ví dụ:

```text
Engineer Lv3
→ machine efficiency +10%
```

---

# 129. BASE DEFENSE

Defense score:

```text
Walls
Gates
Towers
Guards
Turrets
Lighting
Alarm
```

Nếu:

```text
Defense > Threat
```

Raid dễ bị đẩy lùi.

Nếu:

```text
Threat > Defense
```

Có thể mất:

- resources;
- building HP;
- NPC;
- territory.

Không phá progression không thể phục hồi.

---

# 130. THREAT LEVEL

Mỗi khu vực có:

```text
Threat Level 0–10
```

Threat tăng khi:

- faction hostile;
- rare creature;
- storm;
- story event;
- player actions.

Map hiển thị:

```text
Safe
Low
Medium
High
Extreme
Unknown
```

---

# 131. RECOVERY SYSTEM

Sau disaster:

```text
Damage Assessment
↓
Emergency Mode
↓
Repair
↓
Rebuild
↓
Recovery
```

Một số NPC có thể giúp repair.

---

# 132. DISASTER REWARD

Thiên tai không chỉ là punishment.

Sau storm:

- floating debris nhiều hơn;
- wreck mới có thể lộ ra;
- rare resources có thể trôi tới;
- island cave có thể mở;
- faction có thể rút khỏi khu vực.

Như vậy thiên tai tạo gameplay thay vì chỉ gây khó chịu.

---

# 133. WORLD CHANGE RULE

Không regenerate toàn bộ world.

Dùng:

```text
Static World
+
Persistent World Events
+
Player Construction
+
Dynamic POI
```

Ví dụ:

```text
Island Seed
+
Player Base
+
Storm Damage
+
Faction Occupation
+
Quest State
=
Current Island State
```

---

# 134. WORLD DATABASE

Mỗi island lưu:

```text
IslandState
{
    IslandId
    Seed
    Transform
    Buildings[]
    Containers[]
    Machines[]
    NPCs[]
    Resources[]
    POIs[]
    FactionState
    WeatherDamage
    DiscoveryState
    DevelopmentLevel
}
```

Chỉ lưu delta thay đổi nếu cần tối ưu.

---

# 135. IMPORTANT PERFORMANCE RULE

Không save toàn bộ vegetation/object.

Chỉ save:

```text
Player modifications
Important resources
Buildings
Machines
Containers
NPC
Quest
POI
World events
```

Vegetation có thể regenerate theo seed + time.

---

# 136. BASE MANAGEMENT UI

Khi ở trong base:

```text
BASE OVERVIEW

Power       82%
Water       67%
Food        54%
Defense     71%
Storage     63%
Population  4
Threat      Low

[Build]
[Manage]
[Research]
[Storage]
[Map]
[Defenses]
```

---

# 137. ISLAND MANAGEMENT UI

```text
ISLAND: HAVEN-03

Development: Outpost Lv2

Power       ███████░░░
Water       ██████░░░░
Food        ████████░░
Defense     █████░░░░░
Threat      MEDIUM

Buildings:
24

Known POI:
8

Faction:
Neutral

[Map]
[Build]
[Research]
[Defend]
[Rename Island]
```

---

# 138. PLAYER NAMING / DISCOVERY

Người chơi có thể đặt tên:

```text
Island
Base
Wreck
Marker
Ship
Submarine
```

Ví dụ:

> “Đảo Mặt Trời”

> “Kho Sắt”

> “Vùng Cá Mập”

Tên phải lưu vào save.

---

# 139. DISCOVERY REWARD

Khi phát hiện địa điểm mới:

```text
DISCOVERY
+50 Exploration XP
+1 Map Data
```

Rare discovery:

```text
+ Blueprint
+ Achievement
+ Story clue
```

---

# 140. ACHIEVEMENT SYSTEM

Ví dụ:

```text
First Night
Build Your First House
Survive a Storm
Dive to 100m
Discover 10 Islands
Build an Island Base
Build a Submarine
Meet a Faction
Become Allied
Defeat Leviathan
Reach the Abyss
```

---

# 141. PLAYER PROGRESSION

Không chỉ level.

Có:

```text
Survival Skill
Crafting Skill
Engineering Skill
Exploration Skill
Diving Skill
Combat Skill
Navigation Skill
```

Skills tăng khi sử dụng.

---

# 142. SKILL PERKS

Engineering:

```text
Faster Crafting
Lower Repair Cost
Machine Efficiency
```

Exploration:

```text
Scanner Range
Map Discovery
Loot Detection
```

Diving:

```text
Oxygen Efficiency
Swim Speed
Pressure Resistance
```

Navigation:

```text
Fuel Efficiency
Weather Prediction
Waypoint Accuracy
```

---

# 143. NO LEVEL GRIND PRINCIPLE

Không bắt người chơi giết 10.000 cá để unlock công nghệ.

Progression chính đến từ:

```text
Discovery
Blueprint
Research
Story
Crafting
Exploration
```

Skill chỉ là bonus.

---

# 144. RESEARCH SYSTEM

Research Station:

```text
Resource
+
Data
+
Artifact
→ Research Points
```

Research tree:

```text
Water
Food
Tools
Industry
Navigation
Energy
Diving
Defense
Abyss
```

---

# 145. ARTIFACT SYSTEM

Artifacts là vật phẩm hiếm.

Ví dụ:

```text
Ancient Compass
Broken Data Core
Unknown Crystal
Abyss Fragment
Ancient Gear
Ocean Tablet
```

Không dùng tất cả làm crafting.

Một số chỉ để:

- story;
- research;
- trade;
- collection.

---

# 146. COLLECTION ROOM

Người chơi có thể xây:

```text
Museum
Research Archive
Artifact Room
```

Trưng bày artifact.

Điều này tạo mục tiêu optional cho người chơi thích khám phá.

---

# 147. BUILDING BLUEPRINT VARIANTS

Mỗi building có style:

```text
Wood
Stone
Metal
Industrial
Research
Ancient
```

Ví dụ cùng một Wall:

```text
Wood Wall
Stone Wall
Metal Wall
Reinforced Wall
Glass Wall
```

Không cần duplicate logic; chỉ khác BuildingData/visual.

---

# 148. HOUSE CUSTOMIZATION

Cho phép:

- wall material
- floor material
- roof
- window
- door
- furniture
- light
- decoration

Mục tiêu:

> Hai người chơi có thể xây hai căn nhà hoàn toàn khác nhau.

---

# 149. BLUEPRINTED STRUCTURES

Ngoài tự xây từng piece, có prefab blueprint:

```text
Small Cabin
Fishing Hut
Watch Tower
Warehouse
Greenhouse
Radio Tower
Research Lab
Storm Shelter
Dock
```

Player có thể:

```text
Select Blueprint
↓
Place
↓
See Required Materials
↓
Build
```

Sau đó vẫn có thể sửa/customize.

---

# 150. BUILDING COST TRANSPARENCY

Trước khi đặt:

```text
STORM SHELTER

Required:
Steel       8/8 ✓
Metal Plate 12/12 ✓
Stone       20/20 ✓
Battery     2/2 ✓

Power:
25 kW

[BUILD]
```

Không để người chơi mất item mà không hiểu tại sao.

---

# 151. CONTEXTUAL BUILDING

Một số structure có bonus nếu đặt đúng:

```text
Solar Panel
→ better when exposed to sunlight

Wind Turbine
→ better in windy area

Farm
→ better near water

Watch Tower
→ better at high elevation

Radio Tower
→ better at high elevation

Lightning Rod
→ must be exposed
```

---

# 152. ISLAND TERRAIN BUILDING

Cho phép xây trên:

- beach
- grass
- rock
- cliff
- elevated terrain

Một số terrain cấm xây.

Ví dụ:

```text
Protected Story POI
→ cannot build
```

Nhằm tránh phá story.

---

# 153. BRIDGE SYSTEM

Người chơi có thể nối:

```text
Base
↓
Bridge
↓
Dock
```

Hoặc:

```text
House
↓
Bridge
↓
Watch Tower
```

Bridge có support.

---

# 154. DOCK SYSTEM

Dock cho phép:

- park raft;
- park boat;
- dock submarine;
- load cargo.

Late game:

```text
Large Dock
→ Multiple Vehicles
```

---

# 155. VEHICLE SYSTEM

Vehicles:

```text
Raft
Small Boat
Speed Boat
Cargo Ship
Submarine
```

Mỗi vehicle:

```text
Hull
Engine
Fuel
Storage
Navigation
Health
Modules
```

---

# 156. VEHICLE MODULES

Boat:

```text
Cargo Module
Fuel Module
Armor Module
Scanner Module
Fishing Module
Weapon Module
```

Submarine:

```text
Oxygen Module
Battery Module
Sonar Module
Cargo Module
Deep Pressure Module
```

---

# 157. EMERGENCY SYSTEM

Player luôn có Emergency Kit:

```text
Flare
Bandage
Water
Food
Repair Material
Oxygen Reserve
```

Không cho unlimited.

---

# 158. EMERGENCY SHELTER

Mỗi major base nên có:

```text
Emergency Shelter
```

Chứa:

- food
- water
- battery
- repair materials
- medical supplies

Khi disaster:

```text
Shelter Mode
```

---

# 159. RADIO SYSTEM

Radio có thể:

- nhận weather warning;
- nhận SOS;
- nhận faction communication;
- nhận quest;
- nghe story logs.

Radio upgrades:

```text
Basic Radio
→ Long Range Radio
→ Encrypted Radio
→ Satellite Radio
```

---

# 160. SATELLITE NETWORK

Late game:

```text
Radio Tower
+
Satellite Uplink
+
Power
```

Mở:

- global map;
- weather prediction;
- faction tracking;
- long-range communication;
- fast travel network.

---

# 161. WORLD EVENTS + STORY INTERACTION

Story event có thể thay đổi world.

Ví dụ:

```text
Player discovers Research Lab
↓
Story chapter advances
↓
New faction becomes active
↓
New POI appears
↓
New storm pattern
↓
New blueprint
```

Nhưng phải giữ backward compatibility với save.

---

# 162. MODULAR EVENT SYSTEM

Event interface:

```csharp
IWorldEvent
```

Mỗi event:

```text
CanStart()
Start()
Update()
Resolve()
SaveState()
LoadState()
```

Events không được viết trực tiếp vào GameManager thành một file khổng lồ.

---

# 163. WORLD EVENT PRIORITY

```text
Story Critical
↓
Major Disaster
↓
Faction Event
↓
POI Event
↓
Ambient Event
```

Nếu hai event xung đột:

- critical story wins;
- events có cooldown;
- không spam player.

---

# 164. SAFE ZONE

Một số đảo có Safe Zone.

Ví dụ:

```text
Trader Island
Research Station
Survivor Settlement
```

Trong safe zone:

- không PvE attack;
- không faction raid;
- có trade;
- có repair;
- có quest.

---

# 165. HOSTILE ZONE

Ngược lại:

```text
Pirate Territory
Abyss Zone
Military Zone
Monster Nest
```

Map hiển thị cảnh báo.

---

# 166. RESOURCE RISK / REWARD

Mỗi biome có resource value.

```text
Safe Ocean
Risk 1
Reward 1

Storm Ocean
Risk 5
Reward 4

Deep Ocean
Risk 7
Reward 7

Abyss
Risk 10
Reward 10+
```

---

# 167. SURVIVAL PREPARATION GAMEPLAY

Trước chuyến đi:

```text
Destination
↓
Weather
↓
Fuel
↓
Food
↓
Water
↓
Equipment
↓
Repair Kit
↓
Map
↓
Departure
```

Player có cảm giác đang chuẩn bị một expedition thật.

---

# 168. EXPEDITION CHECKLIST UI

```text
EXPEDITION

Destination: Deep Wreck

Weather: Storm in 6h

Fuel          ✓
Food          ✓
Water         ✓
Oxygen        ✓
Repair Kit    ✓
Scanner       ✓
Weapon        ✓

Threat: HIGH

[DEPART]
```

---

# 169. AI DIRECTOR

Dùng hệ thống Director để điều chỉnh pacing.

Inputs:

```text
PlayerProgress
TimePlayed
BaseStrength
CurrentBiome
RecentEvents
PlayerHealth
Resources
```

Output:

```text
Creature Spawn
Debris Density
Event Chance
POI Discovery
Weather Intensity
```

Không dùng Director để gian lận theo kiểu luôn spawn đúng thứ player cần.

---

# 170. FAIR RANDOMNESS

Random phải có:

```text
Seed
Weights
Cooldown
Guarantee rules
```

Ví dụ:

Nếu player đã 30 phút không tìm thấy nước:

```text
Water-related opportunity chance ↑
```

Nhưng vẫn giữ tính ngẫu nhiên.

---

# 171. ITEM COMBINATION RULE ENGINE

Mỗi combination:

```text
CombinationId
Inputs[]
Tags[]
Station
Technology
Time
Output[]
Byproducts[]
Chance[]
```

Có thể có byproduct.

Ví dụ:

```text
Iron Ore
+
Coal
→ Iron Ingot
→ Slag x1
```

Slag có thể dùng:

```text
Concrete
→ Reinforced Foundation
```

Như vậy vật liệu phụ cũng có giá trị.

---

# 172. RECYCLING SYSTEM

Late game:

```text
Recycler
```

Cho phép:

```text
Broken Tool
→ Scrap

Old Electronics
→ Copper + Glass + Components

Damaged Machine
→ Parts
```

Không hoàn trả 100%.

---

# 173. DISASSEMBLY

Một số object có:

```text
Repair
Destroy
Disassemble
```

Ví dụ:

```text
Old Generator
→ Steel x3
→ Copper x2
→ Battery x1 (chance)
```

---

# 174. STORAGE NETWORK

Late game:

```text
Storage A
Storage B
Storage C
      ↓
Storage Network
```

Crafting Station có thể lấy material từ network.

Đây là QoL late game.

---

# 175. ITEM TAG EXAMPLES

```text
Wood
Organic
Plant
Metal
Stone
Glass
Electrical
Mechanical
Liquid
Food
Fuel
Medical
Pressure
Thermal
Abyss
Ancient
Electronic
Rare
Quest
```

Tags dùng cho:

- recipe;
- resistance;
- machine compatibility;
- loot;
- research;
- quests.

---

# 176. RECIPE DISCOVERY THROUGH EXPERIMENTATION

Optional feature.

Người chơi có thể thử combination tại:

```text
Experimental Workbench
```

Ví dụ:

```text
Metal + Electrical + Battery
```

Nếu hợp lệ:

```text
NEW RECIPE DISCOVERED
```

Không cho phép exploit vô hạn.

---

# 177. CRAFTING QUALITY

Crafting station nâng cấp:

```text
Basic Workbench
→ Improved Workbench
→ Industrial Workbench
→ Advanced Fabricator
```

Station tier quyết định recipe.

---

# 178. FABRICATION QUEUE

Late game machine có queue:

```text
1. Metal Plate
2. Circuit Board
3. Battery
4. Scanner Module
```

Có priority.

---

# 179. PLAYER BLUEPRINT LIBRARY

Menu:

```text
Blueprints
├── Survival
├── Tools
├── Building
├── Machines
├── Vehicles
├── Diving
├── Defense
└── Abyss
```

Filter:

```text
Owned
Locked
Craftable
Missing Materials
```

---

# 180. FINAL EXPERIENCE TARGET

Người chơi phải cảm thấy:

```text
“Đây là thế giới của mình.”

```

Không chỉ vì có một cái bè.

Mà vì người chơi có thể:

```text
xây bè
+
xây nhà trên đảo
+
xây outpost
+
xây underwater base
+
đánh dấu bản đồ
+
đặt tên địa điểm
+
phát triển đảo
+
giao thương
+
liên minh faction
+
chiến đấu faction
+
chống thiên tai
+
khám phá vực sâu
+
thay đổi thế giới
```

---

# 181. UPDATED MASTER IMPLEMENTATION PRIORITY

Sau khi hoàn thiện MVP:

```text
P1
Island Persistence
Building On Island
Map Markers
House Building

P2
Weather
Disasters
Island Development
NPC

P3
Factions
Territories
Raids
Trading

P4
Vehicles
Cargo
Submarine
Underwater Base

P5
Advanced Research
Abyss
Story
Boss

P6
Multiplayer
```

---

# 182. CODex REQUIREMENT — ISLAND BUILDING

Codex phải tách:

```text
IslandBuildingManager
IslandClaimManager
IslandStateManager
IslandPersistenceService
```

Không gộp tất cả vào BuildingManager.

Bất kỳ object player xây trên island phải có:

```text
PersistentBuildingId
IslandId
LocalPosition
Rotation
BuildingDataId
Health
InventoryState
MachineState
```

---

# 183. CODEX REQUIREMENT — MAP

Tạo:

```text
MapManager
MarkerManager
WaypointManager
DiscoveryManager
MapPersistenceService
```

Marker không lưu trực tiếp trong UI.

UI chỉ hiển thị state từ Manager.

---

# 184. CODEX REQUIREMENT — DISASTER

Tạo:

```text
WeatherManager
DisasterManager
StormEvent
TsunamiEvent
LightningEvent
FogEvent
EarthquakeEvent
```

Mỗi event implement interface chung.

---

# 185. CODEX REQUIREMENT — FACTION

Tạo:

```text
FactionManager
FactionData
FactionRelationship
FactionTerritory
FactionAI
FactionRaidManager
```

Không hard-code faction logic vào Creature AI.

---

# 186. CODEX REQUIREMENT — SAVE

Save phải lưu:

```text
IslandState
BaseState
FactionState
MapMarkers
DiscoveryState
WorldEvents
```

Nếu save cũ thiếu field:

```text
Use default value
```

Không crash.

---

# 187. FIRST LARGE CONTENT TARGET

Sau MVP, mục tiêu content đầu tiên:

```text
10 Island Types
30 POI
50 Resource Types
100 Crafting Recipes
30 Building Pieces
20 Machines
15 Tools/Weapons
10 Armor/Equipment
20 Food Recipes
10 Faction/World Events
8 Major Disasters
5 Factions
3 Vehicles
1 Submarine
1 Underwater Base Tier
```

Đây là target content, không phải yêu cầu phải làm tất cả trước khi có playable build.

---

# 188. SECOND CONTENT TARGET

Khi architecture ổn định:

```text
200+ items/components
150+ recipes
80+ building pieces
50+ machines/structures
30+ creatures
50+ POI
20+ islands/biome variants
10+ faction types/events
```

Ưu tiên tái sử dụng hệ thống data-driven thay vì viết code riêng cho từng item.

---

# 189. GOLDEN RULE

Mọi hệ thống mới phải trả lời ít nhất một câu:

> “Nó làm cho việc sinh tồn, khám phá, xây dựng, chuẩn bị hoặc tiến bộ thú vị hơn như thế nào?”

Nếu không trả lời được:

**Không thêm hệ thống.**

---

# END OF EXPANDED MASTER SPECIFICATION
