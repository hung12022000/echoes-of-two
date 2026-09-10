import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({headless:true, args:['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const contexts = await Promise.all([browser.newContext({viewport:{width:960,height:640}}), browser.newContext({viewport:{width:960,height:640}})]);
for(const context of contexts)await context.addInitScript(()=>{try{localStorage.setItem('echoes.quality','low');}catch{/* about:blank has no storage origin */}});
for(const context of contexts)context.on('page',page=>{page.on('pageerror',e=>console.log('CLIENT_ERROR',e.message));page.on('console',m=>{if(m.type()==='error')console.log('CLIENT_CONSOLE',m.text().slice(0,400));});});
let [host, guest] = await Promise.all(contexts.map(c=>c.newPage()));
for (const p of [host,guest]) { p.on('pageerror',e=>console.log('PAGEERROR',e.message)); }
const url = process.env.QA_URL || 'http://127.0.0.1:5173/';
try {
  await host.goto(url); await host.getByRole('button',{name:/Tạo phòng hai người/}).click();
  const code=await host.getByTestId('room-code').innerText(); console.log('ROOM',code);
  await host.getByRole('status').filter({hasText:/Phòng đã mở/}).waitFor({timeout:30000});
  await guest.goto(url+'?room='+code); await guest.getByRole('button',{name:/Vào phòng →/}).click();
  await guest.getByRole('button',{name:'Tôi đã sẵn sàng'}).waitFor();
  await guest.getByRole('button',{name:'Tôi đã sẵn sàng'}).click({timeout:30000});
  await host.getByRole('button',{name:'Tôi đã sẵn sàng'}).click();
  await host.getByRole('button',{name:'Bắt đầu cùng nhau'}).click();
  await Promise.all([host.getByTestId('game-state').waitFor({timeout:90000}),guest.getByTestId('game-state').waitFor({timeout:90000})]);
  console.log('BOTH_RENDERED');
  await guest.getByRole('textbox',{name:'Tin nhắn đồng đội'}).fill('Mei đã tới vịnh!'); await guest.getByRole('button',{name:'Gửi',exact:true}).click();
  await host.getByText('Mei đã tới vịnh!',{exact:false}).waitFor({timeout:10000}); console.log('CHAT_OK');
  await guest.locator('canvas').focus();await guest.keyboard.press('c');
  await guest.getByRole('dialog',{name:'Sổ tay sinh tồn'}).locator('article').filter({hasText:'Bện dây thừng'}).getByRole('button',{name:'Chế tạo'}).click();
  await guest.getByLabel('Đóng sổ tay').click();
  await host.locator('canvas').focus();await host.keyboard.press('i');
  await host.getByRole('dialog',{name:'Sổ tay sinh tồn'}).locator('article').filter({hasText:'Dây thừng'}).getByText('x1').waitFor({timeout:10000});
  await host.getByLabel('Đóng sổ tay').click();console.log('CRAFT_SYNC_OK');
  await guest.locator('canvas').focus(); await guest.keyboard.down('d');
  await expect.poll(async()=>Math.abs(Number(await guest.getByTestId('game-state').getAttribute('data-x'))-1),{timeout:25000}).toBeGreaterThan(0.5);
  await guest.keyboard.up('d');
  await expect.poll(async()=>Math.abs(Number(await host.getByTestId('game-state').getAttribute('data-partner-x'))-1),{timeout:10000}).toBeGreaterThan(0.5);
  console.log('MOVEMENT_SYNC_OK');
  console.log('GUEST_STATE',await guest.getByTestId('game-state').evaluate(el=>[...el.attributes].map(a=>[a.name,a.value])));
  await host.screenshot({path:'artifacts/online-host.png'}); await guest.screenshot({path:'artifacts/online-guest.png'});
  if(process.env.QA_THIRD==='1') { const third=await browser.newPage();await third.goto(url+'?room='+code);await third.getByRole('button',{name:/Vào phòng →/}).click();await third.getByText(/ROOM_FULL/).waitFor({timeout:60000});console.log('ROOM_FULL_OK');await third.close(); }
  await host.locator('canvas').focus();await host.keyboard.press('k');
  await expect.poll(async()=>Number(await guest.getByTestId('game-state').getAttribute('data-z')),{timeout:20000}).toBeLessThan(10);
  await guest.locator('canvas').focus();await guest.keyboard.down('j');
  await expect(host.getByTestId('game-state')).toHaveAttribute('data-status','battle',{timeout:20000});await guest.keyboard.up('j');
  await expect.poll(async()=>Number(await host.getByTestId('game-state').getAttribute('data-boss-hp'))).toBeLessThan(900);console.log('BOSS_SYNC_OK');
  await guest.close();await host.getByRole('button',{name:'Kết nối lại',exact:true}).waitFor({timeout:90000});console.log('DISCONNECT_DETECTED');
  await host.getByRole('button',{name:'Kết nối lại',exact:true}).click();
  guest=await contexts[1].newPage();await guest.goto(url+'?room='+code);await guest.getByRole('button',{name:/Vào phòng →/}).click();
  await expect(guest.getByTestId('game-state')).toHaveAttribute('data-status','battle',{timeout:90000});
  await expect.poll(async()=>Number(await guest.getByTestId('game-state').getAttribute('data-boss-hp')),{timeout:20000}).toBeLessThan(900);console.log('RECONNECT_RESTORES_BATTLE_OK');
} catch(e) { console.log('FAILED',String(e));if(!host.isClosed())console.log('HOST',await host.locator('body').innerText());if(!guest.isClosed()){console.log('GUEST',await guest.locator('body').innerText());await guest.screenshot({path:'artifacts/reconnect-failure.png'});} process.exitCode=1; }
finally { await browser.close(); }
