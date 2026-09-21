/* 原始开发者：不疾不徐 | Copyright (c) 2026 合肥市朋程共行电子商务有限责任公司 | 许可状态见 COPYRIGHT */
window.KNIGHT_RELEASE=Object.freeze({version:'0.5.1-local',mode:'local'});
document.addEventListener('DOMContentLoaded',()=>{
 const b=document.createElement('button');b.className='btn btn-ghost';b.textContent='关于小骑士乐园';document.querySelector('#view-home').append(b);
 const d=document.createElement('dialog');d.style.cssText='max-width:90vw;width:480px;padding:24px;border-radius:20px;background:var(--card);color:var(--ink);border:1px solid var(--card-border)';d.innerHTML='<h2>小骑士乐园</h2><p>版本：0.5.1-local · 本地测试版</p><p>原始开发者：不疾不徐</p><p>运营及版权主体：合肥市朋程共行电子商务有限责任公司</p><p>许可：非商业用途依 LICENSE 使用并保留署名与来源；包括营利性教育机构在内的商业用途，须另行取得书面授权并支付知识产权许可费。</p><p>大师 AI 使用 GPLv3 的 Stockfish.js，详情见 THIRD_PARTY_NOTICES.md。</p><p>当前反馈保存在本机，可通过“使用反馈”提交或导出。请勿填写个人隐私信息。</p><p>公开发布前将补充正式隐私政策及客服联系渠道。当前不提供公开联网服务。</p><button class="btn btn-primary">关闭</button>';document.body.append(d);b.onclick=()=>d.showModal();d.querySelector('button').onclick=()=>d.close();
});
