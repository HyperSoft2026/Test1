/**
 * OneBot by HyperSoft
 * Slash Command: /ping
 * 
 * Reports WebSocket Heartbeat Latency and Roundtrip Latency.
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('فحص سرعة استجابة وتأخير اتصال البوت (Ping Latency)');

export const category = 'utility';
export const description = 'فحص سرعة استجابة وتأخير اتصال البوت (Ping Latency)';
export const userPermissions = [];

const OFFICIAL_LOGO_URL = 'https://raw.githubusercontent.com/HyperSoft2026/HyperSoft-OneBot/main/public/icon/Logo.png';

export async function execute(interaction) {
  const sent = await interaction.deferReply({ fetchReply: true });
  const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
  const wsPing = interaction.client.ws.ping;

  const embed = new EmbedBuilder()
    .setTitle('🏓 Pong! استجابة OneBot')
    .setColor('#E53935')
    .setAuthor({
      name: 'OneBot by HyperSoft',
      iconURL: OFFICIAL_LOGO_URL
    })
    .setDescription(`معلومات سرعة اتصال **OneBot by HyperSoft** بسيرفرات Discord.`)
    .addFields(
      {
        name: '📡 سرعة الـ WebSocket',
        value: `\`${wsPing >= 0 ? wsPing : 0}ms\``,
        inline: true
      },
      {
        name: '⚡ زمن الرحلة (Roundtrip)',
        value: `\`${Math.max(0, roundtrip)}ms\``,
        inline: true
      },
      {
        name: '🌐 السيرفر الحالي',
        value: interaction.guild?.name || 'محادثة خاصة',
        inline: true
      }
    )
    .setFooter({
      text: `OneBot by HyperSoft • ${interaction.guild?.name || 'Discord'}`,
      iconURL: OFFICIAL_LOGO_URL
    })
    .setTimestamp();

  return await interaction.editReply({ embeds: [embed] });
}

export default {
  data,
  category,
  description,
  userPermissions,
  execute
};
