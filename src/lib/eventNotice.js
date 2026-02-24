const fs = require("fs");
const path = require("path");

const DEFAULT_PERIOD_MINUTES = 36 * 60 + 15;
const STATE_PATH = path.join(__dirname, "..", "..", "data", "system", "event_notice.json");

function readState() {
  try {
    if (!fs.existsSync(STATE_PATH)) return {};
    const raw = fs.readFileSync(STATE_PATH, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("[event-notice] Failed to read state:", error);
    return {};
  }
}

function writeState(nextState) {
  try {
    fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
    fs.writeFileSync(STATE_PATH, JSON.stringify(nextState, null, 2), "utf8");
  } catch (error) {
    console.error("[event-notice] Failed to write state:", error);
  }
}

function parseBaseTime(value) {
  if (!value) return NaN;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return numeric > 1_000_000_000_000 ? numeric : numeric * 1000;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : NaN;
}

function getNextEventAt(baseAtMs, periodMs, nowMs = Date.now()) {
  if (nowMs <= baseAtMs) return baseAtMs;
  const cycles = Math.ceil((nowMs - baseAtMs) / periodMs);
  return baseAtMs + cycles * periodMs;
}

function buildNoticeContent(nextEventAtMs, periodMinutes) {
  const unix = Math.floor(nextEventAtMs / 1000);
  const hours = Math.floor(periodMinutes / 60);
  const minutes = periodMinutes % 60;

  return [
    "**TriangleBot 안내**",
    "",
    `다음 이벤트 시각: <t:${unix}:F>`,
    `남은 시간: <t:${unix}:R>`
  ].join("\n");
}

async function ensureNoticeMessage(client, channelId, configuredMessageId) {
  const channel = await client.channels.fetch(channelId);
  if (!channel || !channel.isTextBased()) {
    throw new Error(`Invalid notice channel: ${channelId}`);
  }

  const state = readState();
  const messageId = configuredMessageId || state.messageId;

  if (messageId) {
    try {
      const existing = await channel.messages.fetch(messageId);
      if (existing) return existing;
    } catch (error) {
      console.warn(`[event-notice] Failed to fetch message ${messageId}, creating a new one.`);
    }
  }

  const created = await channel.send("이벤트 안내 메시지를 준비중이야...");
  writeState({ messageId: created.id });

  try {
    await created.pin();
  } catch (error) {
    console.warn("[event-notice] Could not pin notice message (missing Manage Messages?).");
  }

  return created;
}

function startEventNotice(client) {
  const channelId = process.env.EVENT_NOTICE_CHANNEL_ID;
  const baseAtMs = parseBaseTime(process.env.EVENT_BASE_AT);
  const periodMinutes = Number(process.env.EVENT_PERIOD_MINUTES || DEFAULT_PERIOD_MINUTES);
  const periodMs = periodMinutes * 60 * 1000;
  const configuredMessageId = process.env.EVENT_NOTICE_MESSAGE_ID;

  if (!channelId) {
    console.log("[event-notice] EVENT_NOTICE_CHANNEL_ID is missing. Skipping.");
    return;
  }

  if (!Number.isFinite(baseAtMs)) {
    console.log("[event-notice] EVENT_BASE_AT is invalid or missing. Skipping.");
    return;
  }

  if (!Number.isFinite(periodMinutes) || periodMinutes <= 0) {
    console.log("[event-notice] EVENT_PERIOD_MINUTES is invalid. Skipping.");
    return;
  }

  let timer = null;

  const update = async () => {
    try {
      const msg = await ensureNoticeMessage(client, channelId, configuredMessageId);
      const nextEventAtMs = getNextEventAt(baseAtMs, periodMs);
      await msg.edit(buildNoticeContent(nextEventAtMs, periodMinutes));

      const waitMs = Math.max(1_000, nextEventAtMs - Date.now() + 1_000);
      timer = setTimeout(update, waitMs);
    } catch (error) {
      console.error("[event-notice] Update failed:", error);
      timer = setTimeout(update, 60_000);
    }
  };

  update();

  client.on("shardDisconnect", () => {
    if (timer) clearTimeout(timer);
  });
}

module.exports = {
  startEventNotice
};
