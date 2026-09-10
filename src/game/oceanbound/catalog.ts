export type ItemCategory = 'resource' | 'material' | 'tool' | 'food' | 'machine' | 'building';

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
}

const item = (id: string, name: string, icon: string, category: ItemCategory, tier: number, description: string): ItemData => ({ id, name, icon, category, tier, description });

const ITEM_LIST: ItemData[] = [
  item('driftwood', 'Gỗ trôi', '🪵', 'resource', 0, 'Gỗ ướt dạt vào bờ, dùng để xẻ ván.'),
  item('plastic', 'Nhựa tái chế', '♻️', 'resource', 0, 'Nhựa nổi được làm sạch để chế tạo.'),
  item('fiber', 'Sợi cọ', '🌿', 'resource', 0, 'Sợi thực vật bền, dùng bện dây.'),
  item('stone', 'Đá ven đảo', '🪨', 'resource', 0, 'Đá chắc dùng cho bếp và gia cố.'),
  item('scrap', 'Sắt phế liệu', '⚙️', 'resource', 1, 'Kim loại thu hồi từ xác tàu.'),
  item('coconut', 'Dừa', '🥥', 'food', 0, 'Hồi một ít đói và khát.'),
  item('fish', 'Cá tươi', '🐟', 'food', 0, 'Cần nướng trước khi ăn an toàn.'),
  item('rope', 'Dây thừng', '🪢', 'material', 0, 'Ba bó sợi cọ bện thành dây.'),
  item('plank', 'Ván gỗ', '▤', 'material', 0, 'Gỗ trôi được xử lý thành ván.'),
  item('charcoal', 'Than củi', '◼', 'material', 1, 'Nhiên liệu lọc nước và nấu ăn.'),
  item('fresh_water', 'Nước sạch', '💧', 'food', 0, 'Nước đã lọc, hồi mạnh chỉ số khát.'),
  item('cooked_fish', 'Cá nướng', '🍢', 'food', 0, 'Bữa ăn nóng giúp hồi đói.'),
  item('hook', 'Móc thu gom', '🪝', 'tool', 1, 'Tăng hiệu quả thu gom vật trôi.'),
  item('spear', 'Lao sinh tồn', '🔱', 'tool', 1, 'Tự vệ trước sinh vật biển.'),
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
];

export const ITEMS: Record<string, ItemData> = Object.fromEntries(ITEM_LIST.map(entry => [entry.id, entry]));

export const RECIPES: RecipeData[] = [
  { id: 'rope', name: 'Bện dây thừng', icon: '🪢', category: 'survival', inputs: { fiber: 3 }, output: { item: 'rope', amount: 1 }, description: 'Nguyên liệu cơ bản cho công cụ và kiến trúc.' },
  { id: 'plank', name: 'Xẻ ván gỗ', icon: '▤', category: 'survival', inputs: { driftwood: 2 }, output: { item: 'plank', amount: 1 }, description: 'Bước xử lý đầu tiên của chuỗi xây dựng.' },
  { id: 'charcoal', name: 'Đốt than củi', icon: '◼', category: 'survival', inputs: { driftwood: 2, stone: 1 }, output: { item: 'charcoal', amount: 1 }, description: 'Nhiên liệu cho bếp và lõi lọc.' },
  { id: 'fresh_water', name: 'Lọc nước biển', icon: '💧', category: 'survival', inputs: { plastic: 1, charcoal: 1 }, output: { item: 'fresh_water', amount: 2 }, description: 'Nguồn nước khẩn cấp trước khi có máy lọc.' },
  { id: 'cooked_fish', name: 'Nướng cá', icon: '🍢', category: 'survival', inputs: { fish: 1, charcoal: 1 }, output: { item: 'cooked_fish', amount: 1 }, description: 'Thức ăn giàu năng lượng.' },
  { id: 'hook', name: 'Móc thu gom', icon: '🪝', category: 'tool', inputs: { scrap: 1, rope: 2, plank: 1 }, output: { item: 'hook', amount: 1 }, description: 'Mỗi lần nhặt nhận thêm một tài nguyên.' },
  { id: 'spear', name: 'Lao sinh tồn', icon: '🔱', category: 'tool', inputs: { plank: 2, rope: 1, scrap: 1 }, output: { item: 'spear', amount: 1 }, description: 'Giảm nguy cơ bị cá mập tấn công.' },
  { id: 'foundation', name: 'Sàn móng', icon: '▦', category: 'building', inputs: { plank: 2, rope: 1 }, output: { item: 'foundation', amount: 1 }, description: 'Đặt bằng B tại vị trí nhân vật.' },
  { id: 'wall', name: 'Tường gỗ', icon: '▥', category: 'building', inputs: { plank: 2, fiber: 2 }, output: { item: 'wall', amount: 1 }, description: 'Tăng độ kín và cấp phát triển đảo.' },
  { id: 'door', name: 'Khung cửa', icon: '🚪', category: 'building', inputs: { plank: 2, rope: 1 }, output: { item: 'door', amount: 1 }, description: 'Hoàn thiện lối vào căn nhà.' },
  { id: 'roof', name: 'Mái cọ', icon: '⌂', category: 'building', inputs: { plank: 2, fiber: 4 }, output: { item: 'roof', amount: 1 }, description: 'Che mưa và tăng tiện nghi.' },
  { id: 'storage', name: 'Rương chứa đồ', icon: '🧰', category: 'building', inputs: { plank: 4, rope: 2 }, output: { item: 'storage', amount: 1 }, description: 'Kho đồ cho căn cứ.' },
  { id: 'purifier', name: 'Máy lọc nước', icon: '🚰', category: 'building', inputs: { plastic: 4, charcoal: 2, rope: 1, scrap: 1 }, output: { item: 'purifier', amount: 1 }, description: 'Tự sản xuất nước sạch mỗi ngày.' },
  { id: 'grill', name: 'Bếp nướng', icon: '♨️', category: 'building', inputs: { plank: 3, stone: 3, scrap: 2 }, output: { item: 'grill', amount: 1 }, description: 'Khu bếp cho căn nhà.' },
  { id: 'beacon', name: 'Cột mốc đảo', icon: '📡', category: 'building', inputs: { plank: 3, scrap: 3, plastic: 2, rope: 2 }, output: { item: 'beacon', amount: 1 }, description: 'Claim khu vực và tự tạo marker căn cứ.' },
  { id: 'anchor', name: 'Neo chống bão', icon: '⚓', category: 'defense', inputs: { scrap: 5, rope: 3, stone: 3 }, output: { item: 'anchor', amount: 1 }, description: 'Giảm 70% hư hại trong bão.' },
  { id: 'lightning_rod', name: 'Cột thu lôi', icon: 'ϟ', category: 'defense', inputs: { scrap: 6, rope: 1 }, output: { item: 'lightning_rod', amount: 1 }, description: 'Vô hiệu hóa sát thương sét.' },
];

export const BUILDABLES = RECIPES.filter(recipe => recipe.category === 'building' || recipe.category === 'defense').map(recipe => recipe.output.item);

export const itemName = (id: string) => ITEMS[id]?.name ?? id;

export function formatCost(inputs: Record<string, number>, inventory: Record<string, number>) {
  return Object.entries(inputs).map(([id, amount]) => `${itemName(id)} ${inventory[id] ?? 0}/${amount}`).join(' · ');
}
