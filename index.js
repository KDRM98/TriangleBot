import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once("ready", () => {
  console.log(`✅ 로그인 완료: ${client.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
