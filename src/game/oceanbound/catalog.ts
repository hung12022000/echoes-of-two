export type ItemCategory = 'resource' | 'material' | 'tool' | 'food' | 'medicine' | 'seed' | 'key' | 'machine' | 'building';

export interface CropData { id: string; name: string; icon: string; size: 'small' | 'large'; stageSeconds: 30; harvests: number; produceName: string; produceCategory: 'food' | 'material'; }
export const CROPS: CropData[] = [
  { id: 'water_spinach', name: 'Rau muống', icon: '🥬', size: 'small', stageSeconds: 30, harvests: 2, produceName: 'Rau muống tươi', produceCategory: 'food' },
  { id: 'tomato', name: 'Cà chua', icon: '🍅', size: 'small', stageSeconds: 30, harvests: 3, produceName: 'Cà chua', produceCategory: 'food' },
  { id: 'pineapple', name: 'Dứa', icon: '🍍', size: 'small', stageSeconds: 30, harvests: 2, produceName: 'Dứa chín', produceCategory: 'food' },
  { id: 'rose', name: 'Hoa hồng', icon: '🌹', size: 'small', stageSeconds: 30, harvests: 3, produceName: 'Hoa hồng', produceCategory: 'material' },
  { id: 'lotus', name: 'Hoa sen', icon: '🪷', size: 'small', stageSeconds: 30, harvests: 3, produceName: 'Hoa sen', produceCategory: 'material' },
  { id: 'banana', name: 'Chuối', icon: '🍌', size: 'large', stageSeconds: 30, harvests: 4, produceName: 'Nải chuối', produceCategory: 'food' },
  { id: 'coconut_tree', name: 'Dừa', icon: '🥥', size: 'large', stageSeconds: 30, harvests: 5, produceName: 'Dừa', produceCategory: 'food' },
  { id: 'mango', name: 'Xoài', icon: '🥭', size: 'large', stageSeconds: 30, harvests: 4, produceName: 'Xoài chín', produceCategory: 'food' },
  { id: 'papaya', name: 'Đu đủ', icon: '🟠', size: 'large', stageSeconds: 30, harvests: 4, produceName: 'Đu đủ', produceCategory: 'food' },
  { id: 'guava', name: 'Ổi', icon: '🟢', size: 'large', stageSeconds: 30, harvests: 4, produceName: 'Ổi', produceCategory: 'food' },
  { id: 'jackfruit', name: 'Mít', icon: '🌳', size: 'large', stageSeconds: 30, harvests: 3, produceName: 'Múi mít', produceCategory: 'food' },
  { id: 'dragonfruit', name: 'Thanh long', icon: '🐉', size: 'large', stageSeconds: 30, harvests: 3, produceName: 'Thanh long', produceCategory: 'food' },
  { id: 'lime', name: 'Chanh', icon: '🍋', size: 'large', stageSeconds: 30, harvests: 5, produceName: 'Chanh', produceCategory: 'food' },
  { id: 'orange', name: 'Cam', icon: '🍊', size: 'large', stageSeconds: 30, harvests: 4, produceName: 'Cam', produceCategory: 'food' },
  { id: 'starfruit', name: 'Khế', icon: '⭐', size: 'large', stageSeconds: 30, harvests: 4, produceName: 'Khế', produceCategory: 'food' },
];

export interface ItemData {
  id: string;
  name: string;
  icon: string;
  category: ItemCategory;
  tier: number;
  description: string;
}

export interface RecipeData {
  id: string;
  name: string;
  icon: string;
  category: 'survival' | 'tool' | 'building' | 'defense';
  inputs: Record<string, number>;
  output: { item: string; amount: number };
  description: string;
  craftSeconds: number;
}

const item = (id: string, name: string, icon: string, category: ItemCategory, tier: number, description: string): ItemData => ({ id, name, icon, category, tier, description });

const ITEM_LIST: ItemData[] = [
  item('driftwood', 'Gỗ trôi', '🪵', 'resource', 0, 'Gỗ ướt dạt vào bờ, dùng để xẻ ván.'),
  item('plastic', 'Nhựa tái chế', '♻️', 'resource', 0, 'Nhựa nổi được làm sạch để chế tạo.'),
  item('fiber', 'Sợi cọ', '🌿', 'resource', 0, 'Sợi thực vật bền, dùng bện dây.'),
  item('stone', 'Đá ven đảo', '🪨', 'resource', 0, 'Đá chắc dùng cho bếp và gia cố.'),
  item('scrap', 'Sắt phế liệu', '⚙️', 'resource', 1, 'Kim loại thu hồi từ xác tàu.'),
  item('bamboo', 'Tre đảo', '🎋', 'resource', 1, 'Thân tre dẻo để dựng khung và làm cột buồm.'),
  item('clay', 'Đất sét', '🟤', 'resource', 1, 'Nung thành gạch chịu lửa cho công trình bền.'),
  item('seaweed', 'Rong biển', '🌱', 'resource', 1, 'Nguyên liệu thuốc và dây sinh học.'),
  item('shell', 'Vỏ sò', '🐚', 'resource', 1, 'Vật liệu lọc và trang trí tìm thấy ở rạn san hô.'),
  item('herb', 'Thảo dược', '🍃', 'resource', 1, 'Lá thuốc quý mọc trong rừng trên đảo.'),
  item('coconut', 'Dừa', '🥥', 'food', 0, 'Hồi một ít đói và khát.'),
  item('fish', 'Cá tươi', '🐟', 'food', 0, 'Cần nướng trước khi ăn an toàn.'),
  item('rope', 'Dây thừng', '🪢', 'material', 0, 'Ba bó sợi cọ bện thành dây.'),
  item('plank', 'Ván gỗ', '▤', 'material', 0, 'Gỗ trôi được xử lý thành ván.'),
  item('charcoal', 'Than củi', '◼', 'material', 1, 'Nhiên liệu lọc nước và nấu ăn.'),
  item('sailcloth', 'Vải buồm', '◫', 'material', 1, 'Vải bền ghép từ sợi và nhựa tái chế.'),
  item('brick', 'Gạch nung', '🧱', 'material', 2, 'Vật liệu chịu bão cho kiến trúc phức tạp.'),
  item('glass', 'Kính biển', '◇', 'material', 2, 'Kính trong dùng cho la bàn và trạm nghiên cứu.'),
  item('fresh_water', 'Nước sạch', '💧', 'food', 0, 'Nước đã lọc, hồi mạnh chỉ số khát.'),
  item('cooked_fish', 'Cá nướng', '🍢', 'food', 0, 'Bữa ăn nóng giúp hồi đói.'),
  item('medicine', 'Thuốc thảo dược', '🧪', 'medicine', 1, 'Hồi sinh lực và cầm máu khi khám phá đảo.'),
  item('rescue_kit', 'Bộ cứu hộ', '🛟', 'medicine', 2, 'Tiêu hao để kéo đồng đội đã gục đứng dậy.'),
  item('island_key', 'Chìa khóa hải trình', '🗝️', 'key', 3, 'Phần thưởng khi hoàn thành xây dựng và đánh bại quái vật đảo.'),
  item('hook', 'Móc thu gom', '🪝', 'tool', 1, 'Tăng hiệu quả thu gom vật trôi.'),
  item('spear', 'Lao sinh tồn', '🔱', 'tool', 1, 'Tự vệ trước sinh vật biển.'),
  item('hammer', 'Búa kiến trúc', '🔨', 'tool', 1, 'Mở khóa các kết cấu kiên cố và sửa bè.'),
  item('shovel', 'Xẻng trồng cây', '🪏', 'tool', 1, 'Đào đất trong luống và bồn cây trước khi gieo hạt.'),
  item('watering_can', 'Xô tưới nước', '🪣', 'tool', 1, 'Mang nước sạch tới cây trồng trên bè và căn cứ đảo.'),
  item('diving_mask', 'Kính lặn', '🥽', 'tool', 2, 'Cho phép tìm vật liệu hiếm dưới rạn san hô.'),
  item('navigation_compass', 'La bàn hoa tiêu', '🧭', 'tool', 3, 'Hoa hồng, sen và dừa cân bằng kim từ; mở chỉ dẫn hải trình chính xác.'),
  item('foundation', 'Sàn móng', '▦', 'building', 1, 'Móng gỗ cho bè hoặc căn nhà.'),
  item('wall', 'Tường gỗ', '▥', 'building', 1, 'Tạo khu trú ẩn chống gió.'),
  item('door', 'Khung cửa', '🚪', 'building', 1, 'Lối vào cho nhà trên đảo.'),
  item('roof', 'Mái cọ', '⌂', 'building', 1, 'Che mưa và hoàn thiện căn nhà.'),
  item('storage', 'Rương chứa đồ', '🧰', 'building', 1, 'Tăng sức chứa căn cứ.'),
  item('purifier', 'Máy lọc nước', '🚰', 'machine', 1, 'Tạo nước sạch theo thời gian.'),
  item('grill', 'Bếp nướng', '♨️', 'machine', 1, 'Nấu cá thành thức ăn an toàn.'),
  item('beacon', 'Cột mốc đảo', '📡', 'building', 2, 'Đánh dấu căn cứ và mở cấp Tiền đồn.'),
  item('anchor', 'Neo chống bão', '⚓', 'building', 2, 'Giảm thiệt hại do bão cho căn cứ.'),
  item('lightning_rod', 'Cột thu lôi', 'ϟ', 'building', 2, 'Bảo vệ máy móc khi có sét.'),
  item('sail', 'Buồm định hướng', '⛵', 'building', 1, 'Cho chiếc bè nhỏ đủ sức hướng tới đảo đầu tiên.'),
  item('research_table', 'Bàn nghiên cứu', '🧭', 'building', 2, 'Liên kết công thức và ghi lại vật phẩm đã khám phá.'),
  item('watchtower', 'Tháp canh', '🗼', 'building', 3, 'Quan sát quái vật, thời tiết và tín hiệu cứu hộ từ xa.'),
  item('raft_engine', 'Động cơ bè', '🛥️', 'machine', 3, 'Đưa bè vượt dòng chảy mạnh giữa các đảo.'),
  item('small_planter', 'Luống cây nhỏ', '🪴', 'building', 1, 'Trồng 5 giống rau và cây thấp trên bè.'),
  item('tree_planter', 'Bồn cây lớn', '🌳', 'building', 2, 'Giữ rễ cho 10 giống cây ăn quả lớn.'),
  item('rain_collector', 'Máy hứng nước mưa', '🌧️', 'machine', 2, 'Tưới cây và bổ sung nước khi trời mưa.'),
  ...CROPS.flatMap(crop => [
    item(`seed_${crop.id}`, `Hạt ${crop.name}`, crop.icon, 'seed', crop.size === 'small' ? 1 : 2, `Trồng trong ${crop.size === 'small' ? 'luống nhỏ' : 'bồn cây lớn'}; cần nước sạch.`),
    item(`produce_${crop.id}`, crop.produceName, crop.icon, crop.produceCategory, crop.size === 'small' ? 1 : 2, `Sản phẩm thu hoạch từ ${crop.name}; dùng trực tiếp hoặc làm nguyên liệu.`),
  ]),
];

export const ITEMS: Record<string, ItemData> = Object.fromEntries(ITEM_LIST.map(entry => [entry.id, entry]));

const BASE_RECIPES: Omit<RecipeData, 'craftSeconds'>[] = [
  { id: 'rope', name: 'Bện dây thừng', icon: '🪢', category: 'survival', inputs: { fiber: 3 }, output: { item: 'rope', amount: 1 }, description: 'Nguyên liệu cơ bản cho công cụ và kiến trúc.' },
  { id: 'plank', name: 'Xẻ ván gỗ', icon: '▤', category: 'survival', inputs: { driftwood: 2 }, output: { item: 'plank', amount: 1 }, description: 'Bước xử lý đầu tiên của chuỗi xây dựng.' },
  { id: 'charcoal', name: 'Đốt than củi', icon: '◼', category: 'survival', inputs: { driftwood: 2, stone: 1 }, output: { item: 'charcoal', amount: 1 }, description: 'Nhiên liệu cho bếp và lõi lọc.' },
  { id: 'fresh_water', name: 'Lọc nước biển', icon: '💧', category: 'survival', inputs: { plastic: 1, charcoal: 1 }, output: { item: 'fresh_water', amount: 2 }, description: 'Nguồn nước khẩn cấp trước khi có máy lọc.' },
  { id: 'cooked_fish', name: 'Nướng cá', icon: '🍢', category: 'survival', inputs: { fish: 1, charcoal: 1 }, output: { item: 'cooked_fish', amount: 1 }, description: 'Thức ăn giàu năng lượng.' },
  { id: 'hook', name: 'Móc thu gom', icon: '🪝', category: 'tool', inputs: { scrap: 1, rope: 2, plank: 1 }, output: { item: 'hook', amount: 1 }, description: 'Mỗi lần nhặt nhận thêm một tài nguyên.' },
  { id: 'spear', name: 'Lao sinh tồn', icon: '🔱', category: 'tool', inputs: { plank: 2, rope: 1, scrap: 1 }, output: { item: 'spear', amount: 1 }, description: 'Giảm nguy cơ bị cá mập tấn công.' },
  { id: 'hammer', name: 'Búa kiến trúc', icon: '🔨', category: 'tool', inputs: { plank: 2, scrap: 2, rope: 1 }, output: { item: 'hammer', amount: 1 }, description: 'Công cụ nền tảng cho kiến trúc cấp cao.' },
  { id: 'shovel', name: 'Xẻng trồng cây', icon: '🪏', category: 'tool', inputs: { plank: 1, scrap: 2, rope: 1 }, output: { item: 'shovel', amount: 1 }, description: 'Bắt buộc để đào đất và gieo mọi giống cây.' },
  { id: 'watering_can', name: 'Xô tưới nước', icon: '🪣', category: 'tool', inputs: { plastic: 3, scrap: 1, rope: 1 }, output: { item: 'watering_can', amount: 1 }, description: 'Bắt buộc để dùng Nước sạch tưới cây.' },
  { id: 'sailcloth', name: 'Dệt vải buồm', icon: '◫', category: 'survival', inputs: { fiber: 4, plastic: 2 }, output: { item: 'sailcloth', amount: 1 }, description: 'Mắt xích giữa vật trôi và hệ thống di chuyển bè.' },
  { id: 'brick', name: 'Nung gạch', icon: '🧱', category: 'survival', inputs: { clay: 2, charcoal: 1 }, output: { item: 'brick', amount: 2 }, description: 'Dùng cho tháp và công trình chống bão.' },
  { id: 'glass', name: 'Nấu kính biển', icon: '◇', category: 'survival', inputs: { shell: 2, charcoal: 1 }, output: { item: 'glass', amount: 1 }, description: 'Thành phần quang học cho thám hiểm.' },
  { id: 'medicine', name: 'Pha thuốc thảo dược', icon: '🧪', category: 'survival', inputs: { herb: 2, seaweed: 1, fresh_water: 1 }, output: { item: 'medicine', amount: 1 }, description: 'Mang theo trước khi đối đầu quái vật đảo.' },
  { id: 'rescue_kit', name: 'Bộ cứu hộ đồng đội', icon: '🛟', category: 'survival', inputs: { rope: 2, sailcloth: 1, medicine: 1 }, output: { item: 'rescue_kit', amount: 1 }, description: 'Bắt buộc để hồi sinh khi chỉ còn một người đứng vững.' },
  { id: 'diving_mask', name: 'Kính lặn rạn ngọc', icon: '🥽', category: 'tool', inputs: { glass: 2, plastic: 2, rope: 1 }, output: { item: 'diving_mask', amount: 1 }, description: 'Mở chuỗi tài nguyên dưới biển.' },
  { id: 'navigation_compass', name: 'La bàn hoa tiêu', icon: '🧭', category: 'tool', inputs: { produce_rose: 10, produce_lotus: 5, produce_coconut_tree: 3, glass: 2, scrap: 2 }, output: { item: 'navigation_compass', amount: 1 }, description: 'Chuỗi nông nghiệp–thám hiểm cấp cao để định vị đảo và tín hiệu cứu hộ.' },
  { id: 'foundation', name: 'Sàn móng', icon: '▦', category: 'building', inputs: { plank: 2, rope: 1 }, output: { item: 'foundation', amount: 1 }, description: 'Đặt bằng B tại vị trí nhân vật.' },
  { id: 'wall', name: 'Tường gỗ', icon: '▥', category: 'building', inputs: { plank: 2, fiber: 2 }, output: { item: 'wall', amount: 1 }, description: 'Tăng độ kín và cấp phát triển đảo.' },
  { id: 'door', name: 'Khung cửa', icon: '🚪', category: 'building', inputs: { plank: 2, rope: 1 }, output: { item: 'door', amount: 1 }, description: 'Hoàn thiện lối vào căn nhà.' },
  { id: 'roof', name: 'Mái cọ', icon: '⌂', category: 'building', inputs: { plank: 2, fiber: 4 }, output: { item: 'roof', amount: 1 }, description: 'Che mưa và tăng tiện nghi.' },
  { id: 'storage', name: 'Rương chứa đồ', icon: '🧰', category: 'building', inputs: { plank: 4, rope: 2 }, output: { item: 'storage', amount: 1 }, description: 'Kho đồ cho căn cứ.' },
  { id: 'purifier', name: 'Máy lọc nước', icon: '🚰', category: 'building', inputs: { plastic: 4, charcoal: 1, rope: 1, scrap: 1 }, output: { item: 'purifier', amount: 1 }, description: 'Tự sản xuất nước sạch mỗi ngày.' },
  { id: 'grill', name: 'Bếp nướng', icon: '♨️', category: 'building', inputs: { plank: 3, stone: 3, scrap: 2 }, output: { item: 'grill', amount: 1 }, description: 'Khu bếp cho căn nhà.' },
  { id: 'beacon', name: 'Cột mốc đảo', icon: '📡', category: 'building', inputs: { plank: 3, scrap: 3, plastic: 2, rope: 2 }, output: { item: 'beacon', amount: 1 }, description: 'Claim khu vực và tự tạo marker căn cứ.' },
  { id: 'anchor', name: 'Neo chống bão', icon: '⚓', category: 'defense', inputs: { scrap: 5, rope: 3, stone: 3 }, output: { item: 'anchor', amount: 1 }, description: 'Giảm 70% hư hại trong bão.' },
  { id: 'lightning_rod', name: 'Cột thu lôi', icon: 'ϟ', category: 'defense', inputs: { scrap: 6, rope: 1 }, output: { item: 'lightning_rod', amount: 1 }, description: 'Vô hiệu hóa sát thương sét.' },
  { id: 'sail', name: 'Buồm định hướng', icon: '⛵', category: 'building', inputs: { bamboo: 2, sailcloth: 1, rope: 1 }, output: { item: 'sail', amount: 1 }, description: 'Mở hành trình từ bè nhỏ tới đảo đầu tiên.' },
  { id: 'research_table', name: 'Bàn nghiên cứu', icon: '🧭', category: 'building', inputs: { plank: 4, glass: 1, scrap: 2 }, output: { item: 'research_table', amount: 1 }, description: 'Trung tâm sổ tay công thức và khám phá.' },
  { id: 'watchtower', name: 'Tháp canh', icon: '🗼', category: 'defense', inputs: { bamboo: 6, plank: 4, rope: 3, brick: 2 }, output: { item: 'watchtower', amount: 1 }, description: 'Công trình phức hợp bắt tín hiệu máy bay.' },
  { id: 'raft_engine', name: 'Động cơ bè', icon: '🛥️', category: 'building', inputs: { scrap: 8, plastic: 4, rope: 2, charcoal: 2 }, output: { item: 'raft_engine', amount: 1 }, description: 'Chống dòng chảy dữ sau đảo thứ hai.' },
  { id: 'small_planter', name: 'Luống cây nhỏ', icon: '🪴', category: 'building', inputs: { plank: 3, fiber: 3, clay: 2 }, output: { item: 'small_planter', amount: 1 }, description: 'Cho phép gieo 5 giống cây nhỏ.' },
  { id: 'tree_planter', name: 'Bồn cây lớn', icon: '🌳', category: 'building', inputs: { plank: 6, rope: 2, clay: 4 }, output: { item: 'tree_planter', amount: 1 }, description: 'Cho phép gieo 10 giống cây ăn quả.' },
  { id: 'rain_collector', name: 'Máy hứng nước mưa', icon: '🌧️', category: 'building', inputs: { plastic: 5, sailcloth: 1, rope: 2 }, output: { item: 'rain_collector', amount: 1 }, description: 'Tự bổ sung nước tưới khi mưa hoặc giông.' },
];

export const RECIPES: RecipeData[] = BASE_RECIPES.map(recipe => ({
  ...recipe,
  craftSeconds: Math.min(10, 5 + (ITEMS[recipe.output.item]?.tier ?? 0) + (recipe.category === 'defense' ? 2 : recipe.category === 'building' ? 1 : 0)),
}));

export const BUILDABLES = RECIPES.filter(recipe => recipe.category === 'building' || recipe.category === 'defense').map(recipe => recipe.output.item);

export const itemName = (id: string) => ITEMS[id]?.name ?? id;

export function formatCost(inputs: Record<string, number>, inventory: Record<string, number>) {
  return Object.entries(inputs).map(([id, amount]) => `${itemName(id)} ${inventory[id] ?? 0}/${amount}`).join(' · ');
}

export function formatIngredients(inputs: Record<string, number>) {
  return Object.entries(inputs).map(([id, amount]) => `${itemName(id)} ×${amount}`).join(' + ');
}
