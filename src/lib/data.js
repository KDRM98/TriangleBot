const fs = require("fs");
const path = require("path");

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const normalized = raw.replace(/^\uFEFF/, "");
  return JSON.parse(normalized);
}

function loadRunes() {
  const filePath = path.join(__dirname, "..", "..", "data", "runes.json");
  return loadJson(filePath);
}

function loadBarterIndex() {
  const dirPath = path.join(__dirname, "..", "..", "data", "barter");
  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".json"));

  const index = new Map();

  for (const file of files) {
    const entries = loadJson(path.join(dirPath, file));
    for (const entry of entries) {
      for (const receive of entry.receives ?? []) {
        const key = String(receive.item).trim().toLowerCase();
        if (!index.has(key)) {
          index.set(key, []);
        }
        index.get(key).push(entry);
      }
    }
  }

  return index;
}

module.exports = {
  loadRunes,
  loadBarterIndex
};
