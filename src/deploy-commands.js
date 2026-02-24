require("dotenv").config();
const { REST, Routes } = require("discord.js");

const runeCmd = require("./commands/rune");
const barterCmd = require("./commands/barter");
const guideCmd = require("./commands/guide");

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID || process.env.GUILD_ID;

if (!token || !clientId) {
  console.error("DISCORD_TOKEN and DISCORD_CLIENT_ID are required.");
  process.exit(1);
}

const commands = [runeCmd.data.toJSON(), barterCmd.data.toJSON(), guideCmd.data.toJSON()];
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    // 기존 로직
    // if (guildId) {
    //   console.log("Started refreshing application (/) commands for a guild...");
    //   await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    //   console.log("Successfully reloaded application (/) commands for the guild.");
    // } else {
    //   console.log("Started refreshing application (/) commands globally...");
    //   await rest.put(Routes.applicationCommands(clientId), { body: commands });
    //   console.log("Successfully reloaded application (/) commands globally.");
    // }

    if (!guildId) {
      console.error("DISCORD_GUILD_ID is required for this deploy flow.");
      process.exit(1);
    }

    console.log("Clearing global application (/) commands...");
    await rest.put(Routes.applicationCommands(clientId), { body: [] });
    console.log("Global commands cleared.");

    console.log("Started refreshing application (/) commands for a guild...");
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("Successfully reloaded application (/) commands for the guild.");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
