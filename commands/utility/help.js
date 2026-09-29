/**
 * OneBot by HyperSoft
 * Flagship Slash Command: /help
 * 
 * Interactive Command Center with Category Navigation, Real Discovery,
 * User Ownership Security, and Graceful Component Timeout Handling.
 */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} from 'discord.js';
import { guildDb } from '../../utils/guildDb.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('مركز أوامر OneBot التفاعلي ودليل الاستخدام');

export const category = 'utility';
export const description = 'مركز أوامر OneBot التفاعلي ودليل الاستخدام';
export const userPermissions = [];

// Category metadata definitions (Strictly limited to real categories)
const CATEGORY_META = {
  utility: {
    label: 'أدوات عامة',
    emoji: '🛠️',
    description: 'الأوامر الأساسية والاستعلامية وإعدادات البوت العامة'
  },
  moderation: {
    label: 'الإدارة والمحكمة',
    emoji: '🛡️',
    description: 'أوامر إدارة وتخصيص محكمة السيرفر وسجلات القضايا'
  }
};

const OFFICIAL_LOGO_URL = 'https://raw.githubusercontent.com/HyperSoft2026/HyperSoft-OneBot/main/public/icon/Logo.png';

/**
 * Builds Home Embed
 */
async function buildHomeEmbed(interaction, commandsMap) {
  const guild = interaction.guild;
  const settings = guild ? await guildDb.get(guild.id) : null;
  const totalCommands = commandsMap.size;

  return new EmbedBuilder()
    .setTitle('🤖 مركز أوامر OneBot by HyperSoft')
    .setColor('#E53935')
    .setAuthor({
      name: 'OneBot by HyperSoft',
      iconURL: OFFICIAL_LOGO_URL
    })
    .setThumbnail(OFFICIAL_LOGO_URL)
    .setDescription(
      `أهلاً بك **${interaction.user.username}** في مركز أوامر **OneBot by HyperSoft**.\n` +
      `يعتمد البوت كلياً على نظام **Discord Slash Commands** التفاعلي الحديث.\n\n` +
      `اضغط على أزرار الأقسام أدناه لاستعراض الأوامر المتاحة وصلاحيات كل أمر.`
    )
    .addFields(
      {
        name: '🌐 السيرفر الحالي',
        value: guild ? `**${guild.name}**` : 'محادثة مباشرة',
        inline: true
      },
      {
        name: '⚡ إجمالي الأوامر',
        value: `\`${totalCommands}\` أوامر نشطة`,
        inline: true
      },
      {
        name: '⚙️ البريفكس المخزن',
        value: `\`${settings?.prefix || '!'}\` *(للتوافق فقط)*`,
        inline: true
      }
    )
    .setFooter({
      text: `OneBot by HyperSoft • الإصدار 2.4.0 • طلب بواسطة ${interaction.user.tag}`,
      iconURL: OFFICIAL_LOGO_URL
    })
    .setTimestamp();
}

/**
 * Builds Category Embed for a specific category
 */
function buildCategoryEmbed(interaction, catKey, commandsList) {
  const meta = CATEGORY_META[catKey] || {
    label: catKey,
    emoji: '📁',
    description: 'قائمة الأوامر'
  };

  const embed = new EmbedBuilder()
    .setTitle(`${meta.emoji} قسم: ${meta.label}`)
    .setColor('#E53935')
    .setAuthor({
      name: 'OneBot by HyperSoft',
      iconURL: OFFICIAL_LOGO_URL
    })
    .setDescription(`${meta.description}\n\n`)
    .setFooter({
      text: `OneBot by HyperSoft • ${interaction.guild?.name || 'Discord'}`,
      iconURL: OFFICIAL_LOGO_URL
    })
    .setTimestamp();

  if (commandsList.length === 0) {
    embed.addFields({
      name: 'لا توجد أوامر',
      value: 'لم يتم تسجيل أوامر نشطة في هذا القسم حالياً.'
    });
    return embed;
  }

  for (const cmd of commandsList) {
    const permText = cmd.userPermissions && cmd.userPermissions.length > 0
      ? `🔒 \`${cmd.userPermissions.join(', ')}\``
      : '🟢 متاح للجميع';

    let usage = `\`/${cmd.data.name}\``;
    // Inspect subcommands if any
    const subcommands = cmd.data.options?.filter(opt => opt.toJSON().type === 1);
    if (subcommands && subcommands.length > 0) {
      const subNames = subcommands.map(s => s.name).join(' | ');
      usage = `\`/${cmd.data.name} <${subNames}>\``;
    }

    embed.addFields({
      name: `${usage}`,
      value: `**الوصف:** ${cmd.description || cmd.data.description || 'لا يوجد وصف'}\n**الصلاحية:** ${permText}`,
      inline: false
    });
  }

  return embed;
}

/**
 * Builds Action Rows for Buttons
 */
function buildComponents(currentView = 'home', categoriesPresent = []) {
  const categoryRow = new ActionRowBuilder();

  // Create button for each category that actually has loaded commands
  for (const cat of categoriesPresent) {
    const meta = CATEGORY_META[cat] || { label: cat, emoji: '📁' };
    const isCurrent = currentView === cat;

    categoryRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`help_cat_${cat}`)
        .setLabel(meta.label)
        .setEmoji(meta.emoji)
        .setStyle(isCurrent ? ButtonStyle.Danger : ButtonStyle.Secondary)
    );
  }

  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('help_nav_home')
      .setLabel('الرئيسية')
      .setEmoji('🏠')
      .setStyle(currentView === 'home' ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help_nav_close')
      .setLabel('إغلاق')
      .setEmoji('❌')
      .setStyle(ButtonStyle.Secondary)
  );

  return [categoryRow, navRow];
}

export async function execute(interaction) {
  const commandsMap = interaction.client.commands;

  // Group commands by category dynamically
  const categoriesMap = new Map();
  for (const [name, cmd] of commandsMap.entries()) {
    const cat = cmd.category || 'utility';
    if (!categoriesMap.has(cat)) {
      categoriesMap.set(cat, []);
    }
    categoriesMap.get(cat).push(cmd);
  }

  const categoriesPresent = Array.from(categoriesMap.keys());
  const homeEmbed = await buildHomeEmbed(interaction, commandsMap);
  const components = buildComponents('home', categoriesPresent);

  const response = await interaction.reply({
    embeds: [homeEmbed],
    components,
    fetchReply: true
  });

  // Component Collector for buttons with 120s timeout
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: 120_000
  });

  collector.on('collect', async (btnInt) => {
    // Button Security: Only the user who executed /help can navigate it
    if (btnInt.user.id !== interaction.user.id) {
      return await btnInt.reply({
        content: '❌ لا يمكنك استخدام هذه الأزرار؛ هذا المركز مخصص للمستخدم الذي طلب الأمر فقط.',
        ephemeral: true
      });
    }

    const customId = btnInt.customId;

    // 1. Close Button
    if (customId === 'help_nav_close') {
      collector.stop('user_closed');
      try {
        const closedEmbed = new EmbedBuilder()
          .setTitle('🔒 تم إغلاق مركز أوامر OneBot')
          .setColor('#0F0F0F')
          .setDescription('تم إغلاق الجلسة التفاعلية. يمكنك فتحها مجدداً عبر الأمر `/help`.')
          .setFooter({ text: 'OneBot by HyperSoft' })
          .setTimestamp();

        return await btnInt.update({
          embeds: [closedEmbed],
          components: []
        });
      } catch (err) {
        // Ignore edit error if message already gone
      }
      return;
    }

    // 2. Home Button
    if (customId === 'help_nav_home') {
      const freshHome = await buildHomeEmbed(interaction, commandsMap);
      const updatedComponents = buildComponents('home', categoriesPresent);
      return await btnInt.update({
        embeds: [freshHome],
        components: updatedComponents
      });
    }

    // 3. Category Buttons
    if (customId.startsWith('help_cat_')) {
      const selectedCat = customId.replace('help_cat_', '');
      const catCommands = categoriesMap.get(selectedCat) || [];
      const catEmbed = buildCategoryEmbed(interaction, selectedCat, catCommands);
      const updatedComponents = buildComponents(selectedCat, categoriesPresent);

      return await btnInt.update({
        embeds: [catEmbed],
        components: updatedComponents
      });
    }
  });

  collector.on('end', async (_, reason) => {
    if (reason === 'user_closed') return;

    try {
      // Gracefully disable all buttons on timeout to prevent memory leaks and dead buttons
      const disabledRows = components.map(row => {
        const newRow = new ActionRowBuilder();
        for (const comp of row.components) {
          newRow.addComponents(ButtonBuilder.from(comp).setDisabled(true));
        }
        return newRow;
      });

      await interaction.editReply({
        components: disabledRows
      });
    } catch (e) {
      // Ignored if interaction was deleted
    }
  });
}

export default {
  data,
  category,
  description,
  userPermissions,
  execute
};
