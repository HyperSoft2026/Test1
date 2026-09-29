/**
 * OneBot by HyperSoft
 * Slash Command: /prefix
 * 
 * View or update the prefix configured for this Discord guild.
 * Preserves compatibility with existing database, cache, and dashboard systems.
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { guildDb } from '../../utils/guildDb.js';
import { canExecute } from '../../utils/cmdGuard.js';

export const data = new SlashCommandBuilder()
  .setName('prefix')
  .setDescription('عرض أو تحديث بريفكس السيرفر للتوافق')
  .addStringOption(option =>
    option.setName('new_prefix')
      .setDescription('البريفكس الجديد للسيرفر (اختياري، اتركه فارغاً لعرض البريفكس الحالي)')
      .setRequired(false)
      .setMaxLength(5)
  );

export const category = 'utility';
export const description = 'عرض أو تحديث بريفكس السيرفر للتوافق';
export const userPermissions = [];

const OFFICIAL_LOGO_URL = 'https://raw.githubusercontent.com/HyperSoft2026/HyperSoft-OneBot/main/public/icon/Logo.png';

export async function execute(interaction) {
  if (!interaction.guild) {
    return await interaction.reply({
      content: '❌ هذا الأمر متاح فقط داخل السيرفرات.',
      ephemeral: true
    });
  }

  const newPrefixOption = interaction.options.getString('new_prefix');
  const guildSettings = await guildDb.get(interaction.guild.id);
  const currentPrefix = guildSettings.prefix || '!';

  // 1. View Mode (no new prefix argument provided)
  if (!newPrefixOption) {
    const viewEmbed = new EmbedBuilder()
      .setTitle('⚙️ بريفكس السيرفر')
      .setColor('#E53935')
      .setAuthor({
        name: 'OneBot by HyperSoft',
        iconURL: OFFICIAL_LOGO_URL
      })
      .setDescription(`البريفكس المخزن حالياً لسيرفر **${interaction.guild.name}** هو: \`${currentPrefix}\``)
      .addFields({
        name: '💡 ملاحظة مهمة',
        value: 'انتقل **OneBot** رسمياً إلى أوامر السلاش (`/`). الأوامر متاحة مباشرة عبر كتابة `/` في الدردشة.'
      })
      .setFooter({
        text: `OneBot by HyperSoft • ${interaction.guild.name}`,
        iconURL: OFFICIAL_LOGO_URL
      })
      .setTimestamp();

    return await interaction.reply({ embeds: [viewEmbed] });
  }

  // 2. Set Mode (requires Administrator permission)
  const check = await canExecute(interaction, { userPermissions: ['Administrator'] });
  if (!check.allowed) {
    return await interaction.reply({
      content: `❌ ${check.reason}`,
      ephemeral: true
    });
  }

  const cleanPrefix = newPrefixOption.trim();
  if (!cleanPrefix) {
    return await interaction.reply({
      content: '❌ لا يمكن أن يكون البريفكس فارغاً.',
      ephemeral: true
    });
  }

  // Strictly update per-guild settings with cache invalidation
  await guildDb.set(interaction.guild.id, { prefix: cleanPrefix });

  const successEmbed = new EmbedBuilder()
    .setTitle('✅ تم تحديث البريفكس بنجاح')
    .setColor('#E53935')
    .setAuthor({
      name: 'OneBot by HyperSoft',
      iconURL: OFFICIAL_LOGO_URL
    })
    .setDescription(`تم تغيير بريفكس سيرفر **${interaction.guild.name}** إلى: \`${cleanPrefix}\``)
    .addFields(
      { name: 'البريفكس السابق', value: `\`${currentPrefix}\``, inline: true },
      { name: 'البريفكس الجديد', value: `\`${cleanPrefix}\``, inline: true }
    )
    .setFooter({
      text: `OneBot by HyperSoft • تم التحديث بواسطة ${interaction.user.tag}`,
      iconURL: OFFICIAL_LOGO_URL
    })
    .setTimestamp();

  return await interaction.reply({ embeds: [successEmbed] });
}

export default {
  data,
  category,
  description,
  userPermissions,
  execute
};
