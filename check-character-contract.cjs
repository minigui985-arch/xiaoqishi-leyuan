/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.join(__dirname,'design/character-turnarounds'),contract=JSON.parse(fs.readFileSync(path.join(root,'model-contract.json'),'utf8'));
assert.equal(contract.roles.length,24);assert.equal(new Set(contract.roles.map(r=>r.id)).size,24);
for(const role of contract.roles){
 assert.match(role.id,/^(child|adult)-(crusader|ming)-[prnbqk]$/);
 assert.ok(!role.reference.includes('/')&&!role.reference.includes('..'));
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,role.reference))).digest('hex'),role.sha256,role.id+' 图纸版本变化，须重新核验');
 if(role.id.startsWith('child-')&&role.id.endsWith('-k'))assert.match(role.reference,/-v2\.png$/);
 assert.equal(role.fidelityApproved,false,'当前试制几何体不能冒充已通过三视图验收的模型');
 assert.equal(role.model,null);
}
console.log('PASS: 24 reference identities and SHA-256 locked; child kings use v2. Final 3D model fidelity is NOT approved.');
