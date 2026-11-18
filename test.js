const assert=require("assert"),CSI=require("./src/csi.js");
assert.equal(CSI.ITEMS.length,25);assert.equal(CSI.DIAGNOSES.length,10);
assert.equal(CSI.score(Array(25).fill(4)).total,100);
assert.equal(CSI.score(Array(25).fill(0)).total,0);
assert.equal(CSI.score(Array(24).fill(1)).complete,false);
assert.throws(()=>CSI.score([5]));
[[0,"Subclínico"],[29,"Subclínico"],[30,"Leve"],[40,"Moderado"],[50,"Grave"],[60,"Extremo"],[100,"Extremo"]]
 .forEach(([t,l])=>assert.equal(CSI.level(t),l));
[[0,"Bajo"],[29,"Bajo"],[30,"Leve"],[40,"Moderado"],[50,"Alto"],[59,"Alto"],[60,"Muy alto"],[100,"Muy alto"]].forEach(([s,l])=>assert.equal(CSI.band(s).label,l));
const g=CSI.GROUPS.flatMap(x=>x.items).sort((a,b)=>a-b);
assert.deepEqual(g,Array.from({length:25},(_,i)=>i+1).filter(n=>n!==24));   // cada ítem en un solo grupo, salvo el 24
const r=Array(25).fill(1); r[6]=4; r[23]=4; r[24]=3;
assert.deepEqual(CSI.frequent(r).map(x=>x.items.map(i=>i.n)),[[25],[7]]);   // el 24 nunca aparece
console.log("OK");
