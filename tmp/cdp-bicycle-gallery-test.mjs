import { spawn } from "node:child_process";
import { setTimeout as wait } from "node:timers/promises";

const port = 9337;
const pageUrl = "http://127.0.0.1:3002/";
const edgePath = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const userDataDir = `${process.env.TEMP}/istanbul-cdp-${Date.now()}`;

const browser = spawn(edgePath, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "about:blank"
], { stdio: "ignore" });

async function cdpFetch(path, init) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`, init);
      if (response.ok) return response.json();
    } catch {
      // Browser is still starting.
    }
    await wait(250);
  }
  throw new Error(`CDP endpoint did not respond: ${path}`);
}

function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const messageId = ++id;
          socket.send(JSON.stringify({ id: messageId, method, params }));
          return new Promise((messageResolve, messageReject) => {
            pending.set(messageId, { resolve: messageResolve, reject: messageReject });
          });
        },
        close() {
          socket.close();
        }
      });
    });
    socket.addEventListener("error", reject);
  });
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Evaluation failed");
  }
  return result.result.value;
}

async function mouse(client, type, x, y) {
  await client.send("Input.dispatchMouseEvent", {
    type,
    x,
    y,
    button: type === "mouseMoved" ? "none" : "left",
    buttons: type === "mouseReleased" ? 0 : 1,
    clickCount: type === "mousePressed" ? 1 : 0
  });
}

try {
  const target = await cdpFetch(`/json/new?${encodeURIComponent(pageUrl)}`, { method: "PUT" });
  const client = await connect(target.webSocketDebuggerUrl);

  await client.send("Page.enable");
  await client.send("Runtime.enable");
  await client.send("Emulation.setDeviceMetricsOverride", {
    width: 1280,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false
  });
  await client.send("Page.navigate", { url: pageUrl });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ready = await evaluate(client, `(() => {
      const button = document.querySelector("[data-bicycle-phase] button");
      return Boolean(button && !button.disabled);
    })()`);
    if (ready) break;
    await wait(250);
  }
  await wait(2000);

  const before = await evaluate(client, `(() => {
    const wrapper = document.querySelector("[data-bicycle-phase]");
    const button = wrapper?.querySelector("button");
    const rect = wrapper?.getBoundingClientRect();
    return {
      phase: wrapper?.dataset.bicyclePhase,
      disabled: button?.disabled,
      rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null
    };
  })()`);

  if (!before.rect || before.phase !== "moving" || before.disabled) {
    const domState = await evaluate(client, `({
      readyState: document.readyState,
      title: document.title,
      bodyText: document.body?.innerText?.slice(0, 300),
      bicycleCount: document.querySelectorAll("[data-bicycle-phase]").length
    })`);
    console.log(JSON.stringify({ domState }, null, 2));
    throw new Error(`Bicycle was not draggable: ${JSON.stringify(before)}`);
  }

  const startX = before.rect.left + before.rect.width / 2;
  const startY = before.rect.top + before.rect.height / 2;
  await mouse(client, "mousePressed", startX, startY);
  await mouse(client, "mouseMoved", startX + 35, startY + 8);
  await mouse(client, "mouseMoved", startX + 72, startY + 18);
  await mouse(client, "mouseReleased", startX + 72, startY + 18);
  await wait(900);

  const afterDrag = await evaluate(client, `(() => {
    const wrapper = document.querySelector("[data-bicycle-phase]");
    const rect = wrapper?.getBoundingClientRect();
    return {
      phase: wrapper?.dataset.bicyclePhase,
      rect: rect ? { left: rect.left, top: rect.top } : null
    };
  })()`);

  if (afterDrag.phase !== "moving") {
    throw new Error(`Drag triggered click action: ${JSON.stringify(afterDrag)}`);
  }

  await evaluate(client, `(() => {
    const title = document.getElementById("live-map-title");
    if (!title) return;
    const top = title.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - 760), behavior: "instant" });
  })()`);
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const ready = await evaluate(client, `(() => {
      const button = document.querySelector("[data-bicycle-phase] button");
      return Boolean(button && !button.disabled);
    })()`);
    if (ready) break;
    await wait(250);
  }
  await wait(800);

  const dragToMapRect = await evaluate(client, `(() => {
    const rect = document.querySelector("[data-bicycle-phase]")?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
  })()`);
  const liveMapY = await evaluate(client, `document.getElementById("live-map-title")?.getBoundingClientRect().top ?? 980`);
  const beforeMapDrag = await evaluate(client, `(() => {
    const wrapper = document.querySelector("[data-bicycle-phase]");
    const rect = wrapper?.getBoundingClientRect();
    return {
      liveMapY: document.getElementById("live-map-title")?.getBoundingClientRect().top,
      scrollY: window.scrollY,
      rect: rect ? { left: rect.left, top: rect.top, width: rect.width, height: rect.height } : null,
      disabled: wrapper?.querySelector("button")?.disabled
    };
  })()`);
  await mouse(client, "mousePressed", dragToMapRect.x, dragToMapRect.y);
  await mouse(client, "mouseMoved", dragToMapRect.x, dragToMapRect.y + 80);
  await mouse(client, "mouseMoved", dragToMapRect.x, dragToMapRect.y + 180);
  await mouse(client, "mouseMoved", dragToMapRect.x, liveMapY - 6);
  await mouse(client, "mouseMoved", dragToMapRect.x, liveMapY + 40);
  await mouse(client, "mouseReleased", dragToMapRect.x, liveMapY + 40);
  await wait(900);

  const afterMapDrag = await evaluate(client, `(() => {
    const wrapper = document.querySelector("[data-bicycle-phase]");
    const button = wrapper?.querySelector("button");
    return {
      phase: wrapper?.dataset.bicyclePhase,
      hidden: wrapper?.getAttribute("aria-hidden"),
      disabled: button?.disabled,
      opacity: wrapper ? getComputedStyle(wrapper).opacity : null
    };
  })()`);

  if (afterMapDrag.phase !== "moving" || afterMapDrag.hidden !== "true" || !afterMapDrag.disabled) {
    throw new Error(`Dragging over map did not hide bicycle: ${JSON.stringify({ beforeMapDrag, afterMapDrag, targetY: liveMapY + 40 })}`);
  }

  await client.send("Page.navigate", { url: pageUrl });
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const ready = await evaluate(client, `(() => {
      const button = document.querySelector("[data-bicycle-phase] button");
      return Boolean(button && !button.disabled);
    })()`);
    if (ready) break;
    await wait(250);
  }
  await wait(1000);

  const clickRect = await evaluate(client, `(() => {
    const rect = document.querySelector("[data-bicycle-phase]")?.getBoundingClientRect();
    return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
  })()`);
  await mouse(client, "mousePressed", clickRect.x, clickRect.y);
  await mouse(client, "mouseReleased", clickRect.x, clickRect.y);
  await wait(900);

  const afterClick = await evaluate(client, `document.querySelector("[data-bicycle-phase]")?.dataset.bicyclePhase`);
  if (afterClick !== "punctured") {
    throw new Error(`Click did not puncture bicycle: ${afterClick}`);
  }

  const galleryInfo = await evaluate(client, `(() => ({
    openers: document.querySelectorAll('[aria-label^="Otvori fotografiju"]').length,
    latestOpeners: document.querySelectorAll('#zadnji-update [aria-label^="Otvori fotografiju"]').length,
    timelineOpeners: document.querySelectorAll('#dnevnik [aria-label^="Otvori fotografiju"]').length
  }))()`);

  await client.close();
  console.log(JSON.stringify({ before, afterDrag, afterMapDrag, afterClick, galleryInfo }, null, 2));
} finally {
  browser.kill();
}
