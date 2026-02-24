require("dotenv").config();
const { Client, Collection, GatewayIntentBits } = require("discord.js");

const runeCmd = require("./commands/rune");
const barterCmd = require("./commands/barter");
const guideCmd = require("./commands/guide");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.commands = new Collection();
client.commands.set(runeCmd.data.name, runeCmd);
client.commands.set(barterCmd.data.name, barterCmd);
client.commands.set(guideCmd.data.name, guideCmd);

client.once("ready", () => {
  console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;

  if (interaction.isAutocomplete()) {
    try {
      if (typeof cmd.autocomplete === "function") {
        await cmd.autocomplete(interaction);
      }
    } catch (error) {
      console.error(error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  try {
    await cmd.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: "에러가 발생했어.", ephemeral: true });
    } else {
      await interaction.reply({ content: "에러가 발생했어.", ephemeral: true });
    }
  }
});

const token = process.env.DISCORD_TOKEN || process.env.BOT_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing.");
  process.exit(1);
}

client.login(token);
