const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { randomUUID } = require('node:crypto');
const { chromium } = require('C:/Users/asus/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { createRoomService, server } = require('./friend-server.cjs');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(pathToFileURL(__dirname + '/小骑士乐园-统一主题版.html').href);
    await page.evaluate(() => { go('play'); hideGuide(); });
    await page.locator('[data-mode="local"]').click();
    await page.evaluate(() => hideGuide());
    const index = square => (Number(square[1]) - 1) * 8 + 'abcdefgh'.indexOf(square[0]);
    const move = async (from, to) => {
      await page.locator(`#playBoardWrap [data-idx="${index(from)}"]`).click();
      await page.locator(`#playBoardWrap [data-idx="${index(to)}"]`).click();
      assert.equal(await page.evaluate(() => battle.history.length > 0 && battle.selected === null), true, `${from}-${to} failed`);
    };
    for (const [from, to] of [['e2','e4'],['e7','e5'],['g1','f3'],['b8','c6'],['f1','e2'],['g8','f6'],['e1','g1']]) await move(from,to);
    let result = await page.evaluate(() => ({ king: battle.board[6], rook: battle.board[5], last: battle.history.at(-1).move }));
    assert.equal(result.king?.t, 'k'); assert.equal(result.rook?.t, 'r'); assert.equal(result.last.castle, 'K');

    await page.evaluate(() => initBattle());
    for (const [from, to] of [['e2','e4'],['e7','e5'],['g1','f3'],['b8','c6'],['f1','e2'],['g8','f6'],['e1','h1']]) await move(from,to);
    result = await page.evaluate(() => ({ king: battle.board[6], rook: battle.board[5], last: battle.history.at(-1).move }));
    assert.equal(result.king?.t, 'k'); assert.equal(result.rook?.t, 'r'); assert.equal(result.last.castle, 'K');

    await page.evaluate(() => initBattle());
    for (const [from, to] of [['d2','d4'],['d7','d5'],['b1','c3'],['g8','f6'],['c1','f4'],['e7','e6'],['d1','d2'],['f8','e7'],['e1','c1']]) await move(from,to);
    result = await page.evaluate(() => ({ king: battle.board[2], rook: battle.board[3], last: battle.history.at(-1).move }));
    assert.equal(result.king?.t, 'k'); assert.equal(result.rook?.t, 'r'); assert.equal(result.last.castle, 'Q');

    await page.evaluate(() => initBattle());
    for (const [from, to] of [['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5'],['e5','d6']]) await move(from,to);
    result = await page.evaluate(() => ({ pawn: battle.board[43], captured: battle.board[35], last: battle.history.at(-1).move }));
    assert.equal(result.pawn?.c, 'w'); assert.equal(result.captured, null); assert.equal(result.last.ep, true);

    await page.evaluate(() => initBattle());
    for (const [from, to] of [['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5'],['e5','d5']]) await move(from,to);
    result = await page.evaluate(() => ({ pawn: battle.board[43], captured: battle.board[35], last: battle.history.at(-1).move }));
    assert.equal(result.pawn?.c, 'w'); assert.equal(result.captured, null); assert.equal(result.last.ep, true);

    const service = createRoomService();
    const host = service.act({ action: 'create', color: 'w' });
    const guest = service.act({ action: 'join', id: host.id, inviteCode: host.inviteCode });
    let state = service.act({ ...host, action: 'state' });
    for (const seat of [host, guest]) state = service.act({ ...seat, action: 'ready', version: state.version, op: `ready-${seat.color}` });
    for (const [from, to] of [['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5'],['e5','d6']]) {
      const seat = state.turn === 'w' ? host : guest;
      state = service.act({ ...seat, action: 'move', version: state.version, op: `${from}-${to}`, from: index(from), to: index(to) });
    }
    assert.equal(state.history.at(-1).ep, true);
    assert.equal(state.board[index('d5')], null);
    const castleHost = service.act({ action: 'create', color: 'w' });
    const castleGuest = service.act({ action: 'join', id: castleHost.id, inviteCode: castleHost.inviteCode });
    state = service.act({ ...castleHost, action: 'state' });
    for (const seat of [castleHost, castleGuest]) state = service.act({ ...seat, action: 'ready', version: state.version, op: `castle-ready-${seat.color}` });
    for (const [from, to] of [['e2','e4'],['e7','e5'],['g1','f3'],['b8','c6'],['f1','e2'],['g8','f6'],['e1','g1']]) {
      const seat = state.turn === 'w' ? castleHost : castleGuest;
      state = service.act({ ...seat, action: 'move', version: state.version, op: `castle-${from}-${to}`, from: index(from), to: index(to) });
    }
    assert.equal(state.history.at(-1).castle, 'K');
    assert.equal(state.board[index('f1')]?.t, 'r');

    const httpServer = server();
    await new Promise(resolve => httpServer.listen(0, '127.0.0.1', resolve));
    try {
      const base = `http://127.0.0.1:${httpServer.address().port}`;
      const api = async data => {
        const response = await fetch(base + '/api/friend', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        assert.equal(response.status, 200); return response.json();
      };
      const friendCase = async (opening, from, to, expected, removed) => {
        const white = await api({ action: 'create', color: 'w' });
        const black = await api({ action: 'join', id: white.id, inviteCode: white.inviteCode });
        let room = await api({ ...white, action: 'state' });
        for (const seat of [white, black]) room = await api({ ...seat, action: 'ready', version: room.version, op: randomUUID() });
        for (const [a, b] of opening) room = await api({ ...(room.turn === 'w' ? white : black), action: 'move', version: room.version, op: randomUUID(), from: index(a), to: index(b) });
        const context = await browser.newContext();
        await context.addInitScript(seat => localStorage.setItem('friendSeat', JSON.stringify(seat)), white);
        const friendPage = await context.newPage();
        try {
          await friendPage.goto(base);
          await friendPage.evaluate(() => { go('play'); hideGuide(); });
          await friendPage.waitForFunction(() => document.querySelector('#friendStatus')?.textContent.includes('轮到你走棋'));
          await friendPage.locator(`#friendBoard [data-idx="${index(from)}"]`).click();
          await friendPage.locator(`#friendBoard [data-idx="${index(to)}"]`).click();
          try { await friendPage.waitForFunction(expected => document.querySelector(`#friendBoard [data-idx="${expected}"] .piece`), index(expected), { timeout: 5000 }); }
          catch (error) { throw new Error(`${from}-${to}: ${await friendPage.locator('#friendStatus').innerText()}; ${error.message}`); }
          room = await api({ ...white, action: 'state' });
          assert.equal(room.board[index(removed)], null);
          assert.equal(room.history.at(-1).castle || room.history.at(-1).ep, from === 'e1' ? 'K' : true);
        } finally { await context.close(); }
      };
      await friendCase([['e2','e4'],['e7','e5'],['g1','f3'],['b8','c6'],['f1','e2'],['g8','f6']], 'e1','h1','g1','e1');
      await friendCase([['e2','e4'],['a7','a6'],['e4','e5'],['d7','d5']], 'e5','d5','d6','d5');
    } finally { await new Promise(resolve => httpServer.close(resolve)); }
    console.log('PASS: local and friend UI perform castling/en passant by destination or piece; server keeps correct positions.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

