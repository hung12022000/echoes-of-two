import { chromium, expect } from '@playwright/test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

// Deterministic lifecycle regressions run without a signaling service or GPU.
// Keep these here so the networking QA can run independently of the game scene.
async function protocolRegression() {
  let now = 100000, nextTimer = 0;
  const timers = new Map();
  const schedule = (fn, delay, repeat = false) => { const id = ++nextTimer; timers.set(id, { fn, at: now + delay, delay, repeat }); return id; };
  const advance = ms => {
    const until = now + ms;
    for (;;) {
      const entry = [...timers].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      const [id, timer] = entry; now = timer.at;
      if (timer.repeat) timer.at += timer.delay; else timers.delete(id);
      timer.fn();
    }
    now = until;
  };
  class Connection extends EventEmitter {
    open = false; sent = [];
    dataChannel = { bufferedAmount: 0, readyState: 'connecting' };
    peerConnection = { iceConnectionState: 'checking', getStats: async () => new Map() };
    constructor(peer) { super(); this.peer = peer; }
    start() { this.open = true; this.dataChannel.readyState = 'open'; this.emit('open'); }
    send(data) { this.sent.push(data); }
    close() { this.open = false; this.dataChannel.readyState = 'closed'; this.emit('close'); }
  }
  class FakePeer extends EventEmitter {
    static instances = [];
    open = false; destroyed = false; disconnected = false; connections = []; reconnects = 0;
    constructor() { super(); FakePeer.instances.push(this); }
    start() { this.open = true; this.disconnected = false; this.emit('open'); }
    connect(id) { const connection = new Connection(id); this.connections.push(connection); return connection; }
    reconnect() { this.reconnects++; this.disconnected = false; }
    destroy() { this.destroyed = true; this.open = false; this.emit('close'); }
  }
  const source = readFileSync(new URL('../src/multiplayer/peerRoom.ts', import.meta.url), 'utf8').replaceAll('import.meta.env', '({})');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, { exports, require: name => {
    if (name === 'peerjs') return FakePeer;
    if (name === '../game/rules') return { makeRoomCode: () => 'ABC234' };
    throw new Error(`Unexpected dependency: ${name}`);
  }, console: { info() {} }, Date: class extends Date { static now() { return now; } },
  setTimeout: (fn, delay) => schedule(fn, delay), clearTimeout: id => timers.delete(id),
  setInterval: (fn, delay) => schedule(fn, delay, true), clearInterval: id => timers.delete(id) });
  const { PeerRoom } = exports;
  const hostRoom = new PeerRoom(true); hostRoom.connect(); hostRoom.connect();
  assert.equal(FakePeer.instances.length, 1, 'connect must be idempotent');
  const hostPeer = FakePeer.instances.at(-1); hostPeer.start();
  const first = new Connection('guest-before-refresh'); hostPeer.emit('connection', first); first.start();
  first.close();
  const replacement = new Connection('guest-after-refresh'); hostPeer.emit('connection', replacement); replacement.start();
  assert.equal(hostRoom.view.connected, true, 'refresh must reclaim the vacant host slot');
  first.start(); first.emit('error', new Error('late error')); first.emit('data', { type: 'lobby', ready: true });
  assert.equal(hostRoom.view.connected, true, 'stale callbacks must not overwrite the replacement');
  assert.equal(hostRoom.view.remoteReady, false);
  hostRoom.reconnect();
  const third = new Connection('third-player'); hostPeer.emit('connection', third); third.start();
  assert.equal(third.sent[0]?.type, 'full', 'manual reconnect must not evict a healthy guest');
  assert.equal(replacement.open, true);
  // Loss of signaling alone must preserve the established data connection.
  hostPeer.open = false; hostPeer.disconnected = true; hostPeer.emit('disconnected'); advance(1000);
  assert.equal(hostPeer.reconnects, 1); assert.equal(replacement.open, true);
  hostPeer.start(); assert.equal(hostRoom.view.connected, true); hostRoom.close(); advance(300);

  const guestRoom = new PeerRoom(false); guestRoom.connect();
  const guestPeer = FakePeer.instances.at(-1); guestPeer.start(); const slow = guestPeer.connections[0];
  advance(15000); assert.equal(guestPeer.connections.length, 1, 'do not cancel ICE after 9.5 seconds');
  advance(12000); assert.equal(guestPeer.connections.length, 2, 'retry a timed-out connection');
  const joined = guestPeer.connections[1]; joined.start();
  slow.start(); slow.emit('error', new Error('stale failure'));
  assert.equal(guestRoom.view.connected, true);
  joined.close(); advance(1000); assert.equal(guestPeer.connections.length, 3, 'guest must reconnect automatically');
  const rejoined = guestPeer.connections[2]; rejoined.start();
  rejoined.emit('data', { type: 'full' });
  await Promise.resolve(); advance(30000);
  assert.match(guestRoom.view.notice, /ROOM_FULL/, 'late route stats must not replace ROOM_FULL');
  assert.equal(guestPeer.connections.length, 3, 'full rooms must not retry in a loop'); guestRoom.close();

  const missing = new PeerRoom(false); missing.connect(); const missingPeer = FakePeer.instances.at(-1); missingPeer.start();
  advance(130000); assert.equal(missingPeer.connections.length, 4, 'ICE retries must be bounded');
  assert.match(missing.view.notice, /ICE_TIMEOUT/); missing.close();

  const signal = new PeerRoom(true); signal.connect(); advance(20000);
  assert.match(signal.view.notice, /SIGNAL_TIMEOUT/, 'do not claim a room is open before signaling opens');
  advance(1000); const recovered = FakePeer.instances.at(-1); recovered.start();
  assert.match(signal.view.notice, /Phòng đã mở/); signal.close();
  await Promise.resolve();
  assert.equal(timers.size, 0, 'dispose must clear all lifecycle timers');
  console.log('PROTOCOL_REGRESSIONS_OK: refresh, stale events, full room, ICE budget, automatic reconnect, signaling recovery, cleanup');
}
await protocolRegression();
if (process.env.QA_PROTOCOL_ONLY !== '1') {
const browser = await chromium.launch({headless:true, args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const contexts = await Promise.all([browser.newContext({viewport:{width:960,height:640}}), browser.newContext({viewport:{width:960,height:640}})]);
for(const context of contexts)await context.addInitScript(()=>{try{localStorage.setItem('echoes.quality','low');sessionStorage.setItem('echoes.qa.shortcuts','1');}catch{/* about:blank has no storage origin */}});
const clientErrors = [];
for(const context of contexts)context.on('page',page=>{page.on('pageerror',e=>{clientErrors.push(e.message);console.log('CLIENT_ERROR',e.message);});page.on('console',m=>{if(m.text().startsWith('[Oceanbound network]'))console.log('NETWORK',m.text());else if(m.type()==='error')console.log('CLIENT_CONSOLE',m.text().slice(0,400));});});
let [host, guest] = await Promise.all(contexts.map(c=>c.newPage()));
for (const p of [host,guest]) { p.on('pageerror',e=>console.log('PAGEERROR',e.message)); }
const url = process.env.QA_URL || 'http://127.0.0.1:5173/';
const inviteUrl = code => { const invite = new URL(url); invite.searchParams.set('room',code); return invite.href; };
try {
  await host.goto(url); await host.getByRole('button',{name:/Tạo phòng hai người/}).click();
  const code=await host.getByTestId('room-code').innerText(); console.log('ROOM',code);
  await host.getByRole('status').filter({hasText:/Phòng đã mở/}).waitFor({timeout:30000});
  await guest.goto(inviteUrl(code)); await guest.getByRole('button',{name:/Vào phòng →/}).click();
  await expect(guest.getByRole('button',{name:'Tôi đã sẵn sàng'})).toBeEnabled({timeout:130000});
  await guest.getByRole('button',{name:'Tôi đã sẵn sàng'}).click();
  await host.getByRole('button',{name:'Tôi đã sẵn sàng'}).click();
  await host.getByRole('button',{name:'Bắt đầu cùng nhau'}).click();
  await Promise.all([host.getByTestId('game-state').waitFor({timeout:90000}),guest.getByTestId('game-state').waitFor({timeout:90000})]);
  console.log('BOTH_RENDERED');
  await guest.getByRole('textbox',{name:'Tin nhắn đồng đội'}).fill('Mei đã tới vịnh!'); await guest.getByRole('button',{name:'Gửi',exact:true}).click();
  await host.getByText('Mei đã tới vịnh!',{exact:false}).waitFor({timeout:10000}); console.log('CHAT_OK');
  await guest.locator('canvas').focus();await guest.keyboard.press('c');
  await guest.getByRole('dialog',{name:'Sổ tay sinh tồn'}).locator('article').filter({hasText:'Bện dây thừng'}).getByRole('button',{name:'Chế tạo'}).click();
  await guest.getByLabel('Đóng sổ tay').click();
  await expect.poll(async()=>await guest.locator('.crafting-status').count(),{timeout:15000}).toBe(0);
  await host.locator('canvas').focus();await host.keyboard.press('i');
  const ropeCard = host.getByRole('dialog',{name:'Sổ tay sinh tồn'}).locator('article').filter({has:host.getByText('Dây thừng',{exact:true})});
  await ropeCard.getByText('x1',{exact:true}).waitFor({timeout:10000});
  await host.getByLabel('Đóng sổ tay').click();console.log('CRAFT_SYNC_OK');
  await guest.locator('canvas').focus(); await guest.keyboard.down('d');
  await expect.poll(async()=>Math.abs(Number(await guest.getByTestId('game-state').getAttribute('data-x'))-1),{timeout:25000}).toBeGreaterThan(0.5);
  await guest.keyboard.up('d');
  await expect.poll(async()=>Math.abs(Number(await host.getByTestId('game-state').getAttribute('data-partner-x'))-1),{timeout:10000}).toBeGreaterThan(0.5);
  console.log('MOVEMENT_SYNC_OK');
  console.log('GUEST_STATE',await guest.getByTestId('game-state').evaluate(el=>[...el.attributes].map(a=>[a.name,a.value])));
  await host.screenshot({path:'artifacts/online-host.png'}); await guest.screenshot({path:'artifacts/online-guest.png'});
  if(process.env.QA_THIRD!=='0') { const third=await browser.newPage();await third.goto(inviteUrl(code));await third.getByRole('button',{name:/Vào phòng →/}).click();await third.getByText(/ROOM_FULL/).waitFor({timeout:60000});console.log('ROOM_FULL_OK');await third.close(); }
  await host.locator('canvas').focus();await host.keyboard.press('k');
  await expect.poll(async()=>Number(await guest.getByTestId('game-state').getAttribute('data-z')),{timeout:20000}).toBeLessThan(10);
  await guest.locator('canvas').focus();await guest.keyboard.down('j');
  await expect(host.getByTestId('game-state')).toHaveAttribute('data-status','battle',{timeout:20000});await guest.keyboard.up('j');
  await expect.poll(async()=>Number(await host.getByTestId('game-state').getAttribute('data-boss-hp'))).toBeLessThan(900);console.log('BOSS_SYNC_OK');
  await guest.close();await host.getByRole('button',{name:'Kết nối lại',exact:true}).waitFor({timeout:90000});console.log('DISCONNECT_DETECTED');
  // No host-side slot reset: the old script masked the sticky guestId bug.
  guest=await contexts[1].newPage();await guest.goto(inviteUrl(code));await guest.getByRole('button',{name:/Vào phòng →/}).click();
  await expect(guest.getByTestId('game-state')).toHaveAttribute('data-status','battle',{timeout:90000});
  await expect.poll(async()=>Number(await guest.getByTestId('game-state').getAttribute('data-boss-hp')),{timeout:20000}).toBeLessThan(900);console.log('RECONNECT_RESTORES_BATTLE_OK');
  assert.deepEqual(clientErrors, [], 'Browser runtime errors must fail online QA');
} catch(e) { console.log('FAILED',String(e));if(!host.isClosed())console.log('HOST',await host.locator('body').innerText());if(!guest.isClosed()){console.log('GUEST',await guest.locator('body').innerText());await guest.screenshot({path:'artifacts/reconnect-failure.png'});} process.exitCode=1; }
finally { await browser.close(); }
}
