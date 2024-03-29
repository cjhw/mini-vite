console.log("[vite] connecting...");

// 创建客户端 WebSocket 实例
// 其中的 __HMR_PORT__ 之后会被 no-bundle 服务编译成具体的端口号
const socket = new WebSocket(`ws://localhost:__HMR_PORT__`, "vite-hmr");

// 接收服务端的更新信息
socket.addEventListener("message", async ({ data }) => {
  handleMessage(JSON.parse(data)).catch(console.error);
});

interface Update {
  type: "js-update" | "css-update";
  path: string;
  acceptedPath: string;
  timestamp: number;
}

// 根据不同的更新类型进行更新
async function handleMessage(payload: any) {
  switch (payload.type) {
    case "connected":
      console.log(`[vite] connected.`);
      setInterval(() => socket.send("ping"), 1000);
      break;

    case "update":
      payload.updates.forEach((update: Update) => {
        if (update.type === "js-update") {
          console.log(update);

          queueUpdate(fetchUpdate(update));
        }
      });
      break;
  }
}

interface HotModule {
  id: string;
  callbacks: HotCallback[];
}

interface HotCallback {
  deps: string[];
  fn: (modules: object[]) => void;
}

const hotModulesMap = new Map<string, HotModule>();
const pruneMap = new Map<string, (data: any) => void | Promise<void>>();

export const createHotContext = (ownerPath: string) => {
  console.log(ownerPath);

  const mod = hotModulesMap.get(ownerPath);
  if (mod) {
    mod.callbacks = [];
  }

  function acceptDeps(deps: string[], callback: any) {
    const mod: HotModule = hotModulesMap.get(ownerPath) || {
      id: ownerPath,
      callbacks: [],
    };
    mod.callbacks.push({
      deps,
      fn: callback,
    });
    hotModulesMap.set(ownerPath, mod);
  }

  return {
    accept(deps: any) {
      if (typeof deps === "function" || !deps) {
        acceptDeps([ownerPath], ([mod]) => deps && deps(mod));
      }
    },
    prune(cb: (data: any) => void) {
      pruneMap.set(ownerPath, cb);
    },
  };
};

let pending = false;
let queued: Promise<(() => void) | undefined>[] = [];

// 批量任务处理，不与具体的热更新行为挂钩，主要起任务调度作用
async function queueUpdate(p: Promise<(() => void) | undefined>) {
  queued.push(p);
  if (!pending) {
    pending = true;
    await Promise.resolve();
    pending = false;
    const loading = [...queued];
    queued = [];
    (await Promise.all(loading)).forEach((fn) => fn && fn());
  }
}

async function fetchUpdate({ path, timestamp }: Update) {
  const mod = hotModulesMap.get(path);
  console.log(path);
  console.log(hotModulesMap);
  console.log(mod);

  if (!mod) return;

  const moduleMap = new Map();
  const modulesToUpdate = new Set<string>();

  modulesToUpdate.add(path);

  await Promise.all(
    Array.from(modulesToUpdate).map(async (dep) => {
      const [path, query] = dep.split(`?`);
      try {
        const newMod = await import(
          path + `?t=${timestamp}${query ? `&${query}` : ""}`
        );
        console.log(newMod);

        moduleMap.set(dep, newMod);
      } catch (e) {
        console.log(e);
      }
    })
  );

  return () => {
    for (const { deps, fn } of mod.callbacks) {
      fn(deps.map((dep: any) => moduleMap.get(dep)));
    }
    console.log(`[vite] hot updated: ${path}`);
  };
}

const sheetsMap = new Map();

export function updateStyle(id: string, content: string) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement("style");
    style.setAttribute("type", "text/css");
    style.innerHTML = content;
    document.head.appendChild(style);
  } else {
    style.innerHTML = content;
  }
  sheetsMap.set(id, style);
}

export function removeStyle(id: string): void {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
  }
  sheetsMap.delete(id);
}
