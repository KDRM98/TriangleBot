const { SlashCommandBuilder } = require("discord.js");
const { loadRunes } = require("../lib/data");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("룬")
    .setDescription("룬 이름으로 설명을 검색합니다.")
    .addStringOption((option) =>
      option.setName("name").setDescription("룬 이름").setRequired(true).setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().trim().toLowerCase();
    const runes = loadRunes();

    const startsWith = runes.filter((rune) => String(rune.name).toLowerCase().startsWith(focused));
    const includes = runes.filter(
      (rune) =>
        String(rune.name).toLowerCase().includes(focused) &&
        !startsWith.some((first) => first.name === rune.name)
    );

    const matched = [...startsWith, ...includes]
      .slice(0, 25)
      .map((rune) => ({ name: rune.name, value: rune.name }));

    return interaction.respond(matched);
  },

  async execute(interaction) {
    const query = interaction.options.getString("name", true).trim().toLowerCase();
    const runes = loadRunes();

    const exact = runes.find((rune) => String(rune.name).toLowerCase() === query);
    if (exact) {
      return interaction.reply({ content: `**${exact.name}**\n${exact.desc}` });
    }

    const matched = runes.filter((rune) => String(rune.name).toLowerCase().includes(query));

    if (matched.length === 0) {
      return interaction.reply({ content: `룬을 찾지 못했어: ${query}`, ephemeral: true });
    }

    if (matched.length === 1) {
      return interaction.reply({ content: `**${matched[0].name}**\n${matched[0].desc}` });
    }

    const lines = matched.slice(0, 10).map((rune) => `- ${rune.name}`);
    const more = matched.length > 10 ? `\n...외 ${matched.length - 10}개` : "";
    return interaction.reply({
      content: `\`${query}\` 검색 결과가 여러 개야. 더 구체적으로 입력해줘.\n${lines.join("\n")}${more}`,
      ephemeral: true
    });
  }
};
