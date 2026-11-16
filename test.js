const assert=require("assert"),CSI=require("./src/csi.js");
assert.equal(CSI.ITEMS.length,25);assert.equal(CSI.DIAGNOSES.length,10);
assert.equal(CSI.score(Array(25).fill(4)).total,100);
assert.equal(CSI.score(Array(25).fill(0)).total,0);
assert.equal(CSI.score(Array(24).fill(1)).complete,false);
assert.throws(()=>CSI.score([5]));
[[0,"Subclínico"],[29,"Subclínico"],[30,"Leve"],[40,"Moderado"],[50,"Grave"],[60,"Extremo"],[100,"Extremo"]]
 .forEach(([t,l])=>assert.equal(CSI.level(t),l));
console.log("OK");
