import { describe, expect, it } from 'vitest';
import { Encounter, noInput } from '../../src/game/combat/encounter';
import { parseControls } from '../../src/multiplayer/peerRoom';
import { applySnapshot, snapshot } from '../../src/multiplayer/gameSnapshot';
import { cameraRelative, turnTowards } from '../../src/game/player/motion';
const advance = (state: Encounter, seconds: number, input = noInput(), remote = noInput()) => { for (let i=0;i<Math.ceil(seconds/.02);i++) state.step(.02,input,remote); };
describe('playable human-character encounter',()=>{
  it('has camera-relative normalized motion and shortest-path turning',()=>{
    const v=cameraRelative(1,1,0);expect(Math.hypot(v.x,v.z)).toBeCloseTo(1);
    expect(turnTowards(3.13,-3.13,.016)).toBeGreaterThan(3.13);
  });
  it('accelerates, stops, runs faster and respects the island bounds',()=>{
    const a=new Encounter('hung'),b=new Encounter('hung');advance(a,1,{...noInput(),x:1});advance(b,1,{...noInput(),x:1,sprint:true});
    expect(b.local.x).toBeGreaterThan(a.local.x);advance(a,1);expect(Math.abs(a.local.vx)).toBeLessThan(.01);
    advance(b,40,{...noInput(),x:1,sprint:true});expect(Math.hypot(b.local.x/1.08,b.local.z-15)).toBeLessThanOrEqual(62.001);
  });
  it('jumps once, falls and lands without automatic repeat',()=>{
    const state=new Encounter('hung');state.step(.02,{...noInput(),jump:true});expect(state.local.y).toBeGreaterThan(0);
    advance(state,1);expect(state.local.grounded).toBe(true);expect(state.local.y).toBe(0);advance(state,1);expect(state.local.motion).toBe('idle');
  });
  it('does not start a distant battle with an out-of-range attack',()=>{
    const state=new Encounter('hung');state.attack(state.local);expect(state.status).toBe('explore');expect(state.bossHp).toBe(900);
  });
  it('rejects attacks on cooldown and requires both roles to expose armor',()=>{
    const state=new Encounter('hung',true);state.travelToArena();state.actors.hung.z=-1;state.actors.mei.z=0;
    state.attack(state.actors.mei);const hp=state.bossHp;state.attack(state.actors.mei);expect(state.bossHp).toBe(hp);
    for(let i=0;i<4;i++){state.actors.mei.action=state.actors.mei.cooldown=0;state.attack(state.actors.mei);}
    expect(state.marks).toBe(5);state.attack(state.actors.hung,true);expect(state.exposed).toBe(6);expect(state.marks).toBe(0);
  });
  it('requires BOTH online players to hold interaction and resets progress when released',()=>{
    const state=new Encounter('hung',true);advance(state,2,{...noInput(),interact:true});expect(state.resonance).toBe(0);
    advance(state,1,{...noInput(),interact:true},{...noInput(),interact:true});expect(state.linkProgress).toBeGreaterThan(.9);
    state.step(.02,noInput());expect(state.linkProgress).toBe(0);
    advance(state,1.9,{...noInput(),interact:true},{...noInput(),interact:true});expect(state.resonance).toBe(35);
  });
  it('allows the remote human to move without AI overrides',()=>{
    const state=new Encounter('hung',true);advance(state,1,noInput(),{...noInput(),x:1});expect(state.actors.mei.x).toBeGreaterThan(4);expect(state.actors.hung.x).toBe(-1);
  });
  it('revives either role after a continuous nearby hold',()=>{
    const host=new Encounter('hung',true);host.actors.mei.hp=0;advance(host,3.1,{...noInput(),interact:true});expect(host.actors.mei.hp).toBe(36);
    const guest=new Encounter('hung',true);guest.actors.hung.hp=0;advance(guest,3.1,noInput(),{...noInput(),interact:true});expect(guest.actors.hung.hp).toBe(48);
  });
  it('telegraphs damage and dodge grants temporary invulnerability',()=>{
    const a=new Encounter('hung',true);a.travelToArena();a.startBattle();a.attackTimer=.2;advance(a,.22);expect(a.local.hp).toBeLessThan(120);
    const b=new Encounter('hung',true);b.travelToArena();b.startBattle();b.attackTimer=.2;b.step(.02,{...noInput(),dodge:true});advance(b,.2);expect(b.local.hp).toBe(120);
  });
  it('plays through all boss thresholds to victory with combat actions',()=>{
    const state=new Encounter('hung',true);state.travelToArena();state.actors.hung.z=-1;state.actors.mei.z=0;
    const phases=new Set<number>();
    for(let i=0;i<500&&state.status!=='victory';i++) {
      // Advance actual cooldowns; avoid outgoing boss slams in this damage fixture.
      state.attackTimer=5;state.step(.05,noInput());
      state.attack(state.actors.mei);state.attack(state.actors.hung,state.marks>=5&&state.actors.hung.skillCooldown===0);phases.add(state.phase);
    }
    expect(state.status).toBe('victory');expect(state.bossHp).toBe(0);expect([...phases]).toEqual([1,2,3]);
    advance(state,10);expect(state.local.hp).toBe(120);
  });
});
describe('untrusted realtime packets',()=>{
  it('clamps movement and rejects malformed numeric and action data',()=>{
    expect(parseControls({...noInput(),x:200,z:200})!.x).toBeCloseTo(Math.SQRT1_2);
    expect(parseControls({...noInput(),x:Infinity})).toBeNull();expect(parseControls({...noInput(),skill:'yes'})).toBeNull();expect(parseControls(null)).toBeNull();
  });
  it('restores full authoritative game state and rejects invalid snapshots',()=>{
    const host=new Encounter('hung',true),guest=new Encounter('mei',true);host.travelToArena();host.actors.hung.x=3;host.exposed=4;host.marks=3;
    expect(applySnapshot(guest,structuredClone(snapshot(host,[])))).toBe(true);expect(guest.partner.x).toBe(3);expect(guest.exposed).toBe(4);expect(guest.activeRole).toBe('mei');
    expect(applySnapshot(guest,{...snapshot(host,[]),bossHp:NaN})).toBe(false);expect(applySnapshot(guest,{actors:{}})).toBe(false);
  });
});
