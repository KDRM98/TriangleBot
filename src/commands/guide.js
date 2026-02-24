const { AttachmentBuilder, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("공략")
    .setDescription("레이드 공략 PNG를 보여줍니다.")
    .addStringOption((option) =>
      option.setName("raid").setDescription("레이드/던전 이름 (예: 신전)").setRequired(true)
    ),

  async execute(interaction) {
    const raid = interaction.options.getString("raid", true).trim();
    const filePath = path.join(__dirname, "..", "..", "assets", "guides", `${raid}.png`);

    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: `공략 이미지를 찾지 못했어: ${raid}`, ephemeral: true });
    }

    const attachment = new AttachmentBuilder(filePath);
    return interaction.reply({ files: [attachment] });
  }
};
