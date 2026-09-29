/**
 * OneBot by HyperSoft
 * Slash Command: /court
 * 
 * Moderation Court Management & Settings Subcommands.
 * Replaces and upgrades the legacy court_set_* commands.
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { guildDb } from '../../utils/guildDb.js';
import { canExecute } from '../../utils/cmdGuard.js';

export const data = new SlashCommandBuilder()
  .setName('court')
  .setDescription('إعداد وتخصيص محكمة السيرفر وسجلات القضايا')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('set-name')
      .setDescription('تحديد اسم المحكمة المخصص لهذا السيرفر')
      .addStringOption(opt =>
        opt.setName('name')
          .setDescription('اسم المحكمة الجديد')
          .setRequired(true)
          .setMaxLength(100)
      )
  )
  .addSubcommand(sub =>
    sub.setName('set-color')
      .setDescription('تحديد لون رسائل وتضمينات المحكمة (HEX Code)')
      .addStringOption(opt =>
        opt.setName('color')
          .setDescription('كود اللون بتنسيق HEX (مثال: #E53935)')
          .setRequired(true)
          .setMaxLength(7)
      )
  )
  .addSubcommand(sub =>
    sub.setName('set-log')
      .setDescription('تحديد روم سجلات وقضايا المحكمة')
      .addChannelOption(opt =>
        opt.setName('channel')
          .setDescription('قناة السجلات التابعة لهذا السيرفر')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub.setName('set-logo')
      .setDescription('تحديد رابط شعار المحكمة لهذا السيرفر')
      .addStringOption(opt =>
        opt.setName('url')
          .setDescription('رابط صورة الشعار (URL مباشر)')
          .setRequired(false)
      )
  );

export const category = 'moderation';
export const description = 'إعداد وتخصيص محكمة السيرفر وسجلات القضايا (set-name, set-color, set-log, set-logo)';
export const userPermissions = ['Administrator'];

const OFFICIAL_LOGO_URL = 'https://raw.githubusercontent.com/HyperSoft2026/HyperSoft-OneBot/main/public/icon/Logo.png';

const resolveLogoUrl = (url) => {
  if (url && /^https?:\/\//i.test(url)) return url;
  return OFFICIAL_LOGO_URL;
};

export async function execute(interaction) {
  if (!interaction.guild) {
    return await interaction.reply({
      content: '❌ هذا الأمر متاح فقط داخل السيرفرات.',
      ephemeral: true
    });
  }

  // Permission Check
  const check = await canExecute(interaction, { userPermissions: ['Administrator'] });
  if (!check.allowed) {
    return await interaction.reply({
      content: `❌ ${check.reason}`,
      ephemeral: true
    });
  }

  const subcommand = interaction.options.getSubcommand();
  const guildId = interaction.guild.id;
  const currentSettings = await guildDb.get(guildId);
  const currentMod = currentSettings.moderation || {};

  // 1. /court set-name
  if (subcommand === 'set-name') {
    const newName = interaction.options.getString('name').trim();
    if (!newName) {
      return await interaction.reply({
        content: '❌ يرجى إدخال اسم صالح للمحكمة.',
        ephemeral: true
      });
    }

    const updated = await guildDb.set(guildId, {
      moderation: {
        ...currentMod,
        courtName: newName
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('⚖️ تحديث اسم المحكمة')
      .setColor(currentMod.courtColor || '#E53935')
      .setAuthor({ name: 'OneBot by HyperSoft • المحكمة', iconURL: resolveLogoUrl(currentMod.courtLogo) })
      .setDescription(`تم تحديث اسم محكمة سيرفر **${interaction.guild.name}** بنجاح.`)
      .addFields({
        name: 'الاسم الجديد',
        value: `**${updated.moderation.courtName}**`
      })
      .setFooter({
        text: `OneBot by HyperSoft • ${interaction.guild.name}`,
        iconURL: resolveLogoUrl(currentMod.courtLogo)
      })
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] });
  }

  // 2. /court set-color
  if (subcommand === 'set-color') {
    const hexColor = interaction.options.getString('color').trim();
    const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;

    if (!hexRegex.test(hexColor)) {
      return await interaction.reply({
        content: '❌ يرجى إدخال كود لون صالح بنظام HEX (مثال: `#E53935`).',
        ephemeral: true
      });
    }

    const updated = await guildDb.set(guildId, {
      moderation: {
        ...currentMod,
        courtColor: hexColor
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('🎨 تحديث لون تضمينات المحكمة')
      .setColor(hexColor)
      .setAuthor({ name: 'OneBot by HyperSoft • المحكمة', iconURL: resolveLogoUrl(currentMod.courtLogo) })
      .setDescription(`تم تحديث لون المحكمة لسيرفر **${interaction.guild.name}** إلى: \`${hexColor}\``)
      .setFooter({
        text: `OneBot by HyperSoft • ${interaction.guild.name}`,
        iconURL: resolveLogoUrl(currentMod.courtLogo)
      })
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] });
  }

  // 3. /court set-log
  if (subcommand === 'set-log') {
    const targetChannel = interaction.options.getChannel('channel');

    if (!targetChannel) {
      return await interaction.reply({
        content: '❌ يرجى تحديد قناة صالحة تابعة لهذا السيرفر.',
        ephemeral: true
      });
    }

    // Strict Cross-Guild Validation
    if (targetChannel.guildId !== guildId) {
      return await interaction.reply({
        content: '❌ خطأ أمني: القناة المحددة لا تنتمي إلى هذا السيرفر!',
        ephemeral: true
      });
    }

    const updated = await guildDb.set(guildId, {
      moderation: {
        ...currentMod,
        courtLogChannelId: targetChannel.id
      }
    });

    const embed = new EmbedBuilder()
      .setTitle('📜 تعيين روم سجلات المحكمة')
      .setColor(updated.moderation?.courtColor || '#E53935')
      .setAuthor({ name: 'OneBot by HyperSoft • المحكمة', iconURL: resolveLogoUrl(currentMod.courtLogo) })
      .setDescription(`تم تعيين روم سجلات وقضايا المحكمة لسيرفر **${interaction.guild.name}** بنجاح.`)
      .addFields({
        name: 'قناة السجلات المحددة',
        value: `<#${targetChannel.id}> (\`${targetChannel.id}\`)`
      })
      .setFooter({
        text: `OneBot by HyperSoft • ${interaction.guild.name}`,
        iconURL: resolveLogoUrl(currentMod.courtLogo)
      })
      .setTimestamp();

    return await interaction.reply({ embeds: [embed] });
  }

  // 4. /court set-logo
  if (subcommand === 'set-logo') {
    const logoUrl = interaction.options.getString('url')?.trim() || '/icon/Logo.png';

    // Simple URL validation if provided and not the default
    if (logoUrl !== '/icon/Logo.png' && !/^https?:\/\//i.test(logoUrl)) {
      return await interaction.reply({
        content: '❌ يرجى إدخال رابط صورة صالح يبدأ بـ http:// أو https://.',
        ephemeral: true
      });
    }

    const updated = await guildDb.set(guildId, {
      moderation: {
        ...currentMod,
        courtLogo: logoUrl
      }
    });

    const isHttpLogo = /^https?:\/\//i.test(logoUrl);
    const embed = new EmbedBuilder()
      .setTitle('🖼️ تحديث شعار المحكمة')
      .setColor(updated.moderation?.courtColor || '#E53935')
      .setAuthor({ name: 'OneBot by HyperSoft • المحكمة', iconURL: resolveLogoUrl(logoUrl) })
      .setDescription(`تم تحديث شعار محكمة سيرفر **${interaction.guild.name}** بنجاح.`)
      .setFooter({
        text: `OneBot by HyperSoft • ${interaction.guild.name}`,
        iconURL: resolveLogoUrl(logoUrl)
      })
      .setTimestamp();

    if (isHttpLogo) {
      embed.setThumbnail(logoUrl);
    }

    return await interaction.reply({ embeds: [embed] });
  }
}

export default {
  data,
  category,
  description,
  userPermissions,
  execute
};
