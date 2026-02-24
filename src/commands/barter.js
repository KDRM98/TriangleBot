const { SlashCommandBuilder } = require("discord.js");
const { loadBarterIndex } = require("../lib/data");

let barterIndex;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("물물교환")
    .setDescription("받는 물품 기준으로 물물교환 정보를 검색합니다.")
    .addStringOption((option) => option.setName("item").setDescription("받는 물품 이름").setRequired(true)),

  async execute(interaction) {
    const item = interaction.options.getString("item", true).trim().toLowerCase();
    barterIndex ??= loadBarterIndex();

    const list = barterIndex.get(item) ?? [];
    if (list.length === 0) {
      return interaction.reply({ content: `해당 물품을 받는 교환을 찾지 못했어: ${item}`, ephemeral: true });
    }

    const lines = list.slice(0, 10).map((entry) => {
      const gives = (entry.gives ?? []).map((x) => `${x.item}x${x.qty}`).join(", ");
      const receives = (entry.receives ?? []).map((x) => `${x.item}x${x.qty}`).join(", ");
      const note = entry.note ? ` (${entry.note})` : "";
      return `- [${entry.region}] ${entry.npc} | 줌: ${gives} -> 받음: ${receives}${note}`;
    });

    return interaction.reply({
      content: `**"${item}" 받는 물물교환 목록 (최대 10개)**\n${lines.join("\n")}`
    });
  }
};
