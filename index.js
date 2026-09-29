/**
 * OneBot by HyperSoft
 * Official Discord.js Entry Point
 * 
 * Multi-Guild Production Ready Bot Client
 */

import { Client, GatewayIntentBits, Partials, Collection, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { guildDb } from './utils/guildDb.js';
import { canExecute } from './utils/cmdGuard.js';
import { onGuildMemberAdd } from './systems/auto_role.js';
import { loadCommands } from './utils/commandLoader.js';
import { deployCommands } from './utils/deployCommands.js';
import globalConfig from './settings.json' with { type: 'json' };

// Load environment variables (supports standard process.cwd() and Code Nexus container path)
dotenv.config();
const containerEnvPath = '/home/container/.env';
try {
  if (fs.existsSync(containerEnvPath)) {
    dotenv.config({ path: containerEnvPath, override: true });
  }
} catch (e) {
  // Silent fallback to standard process.cwd() .env
}

// 1. Startup Environment Validation
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ [OneBot Startup Error] Missing required environment variable: DISCORD_TOKEN.");
  console.error("👉 Please define DISCORD_TOKEN in your environment variables or .env file before running the bot.");
  process.exit(1);
}

// 2. Initialize Discord Client with precisely required intents
export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

// Collection of commands
client.commands = new Collection();

// 3. Connect to Database (MongoDB if MONGODB_URI provided, otherwise local JSON fallback)
await guildDb.connectMongo(process.env.MONGODB_URI);

// 4. Load Slash Commands dynamically from commands/
await loadCommands(client);

// 5. Bot Ready Event
client.once('ready', async () => {
  console.log(`====================================================`);
  console.log(`🤖 ${globalConfig.branding || 'OneBot by HyperSoft'} is ONLINE!`);
  console.log(`👤 Logged in as: ${client.user.tag} (ID: ${client.user.id})`);
  console.log(`🌐 Active Guilds: ${client.guilds.cache.size}`);
  console.log(`⚡ Multi-Guild Architecture: ENABLED`);
  console.log(`🚀 Slash Commands Engine: ENABLED (${client.commands.size} commands)`);
  console.log(`====================================================`);

  client.user.setPresence({
    activities: [
      {
        name: `OneBot by HyperSoft | /help`,
        type: ActivityType.Custom,
        state: `OneBot by HyperSoft`
      }
    ],
    status: 'online'
  });

  // Deploy Slash Commands to Discord REST
  await deployCommands(client);
});

// 6. Guild Member Add Event (Auto-Role, Welcome, Anti-Bots)
client.on('guildMemberAdd', async (member) => {
  try {
    await onGuildMemberAdd(member);
  } catch (err) {
    console.error(`[guildMemberAdd Error in guild ${member.guild?.id}]:`, err.message);
  }
});

// 7. Interaction Create Event (Primary Slash Command Router)
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[OneBot] Unknown slash command received: /${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`[Interaction Error in /${interaction.commandName}]:`, error);

    const errorMessage = '❌ حدث خطأ غير متوقع أثناء تنفيذ هذا الأمر. يرجى المحاولة لاحقاً.';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: errorMessage, ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true }).catch(() => {});
    }
  }
});

// 8. Message Create Event (Legacy Migration Guidance)
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const guildSettings = await guildDb.get(message.guild.id);
    const prefix = guildSettings.prefix || globalConfig.defaultPrefix || "!";

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    // Guidance for legacy prefix users directing them to slash commands
    if (['help', 'ping', 'prefix', 'court'].includes(commandName)) {
      return message.reply(`💡 انتقل **OneBot** رسمياً إلى أوامر السلاش (Slash Commands)!\nاكتب \`/${commandName}\` في الدردشة لاستخدام الأمر مباشرة.`);
    }
  } catch (err) {
    console.error(`[messageCreate Error in guild ${message.guild?.id}]:`, err.message);
  }
});

// 9. Error Handling & Unhandled Process Safety
process.on('unhandledRejection', (reason, promise) => {
  console.error('[OneBot Anti-Crash] Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[OneBot Anti-Crash] Uncaught Exception:', err.message);
});

// 8. Graceful Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n[OneBot] Received ${signal}. Starting graceful shutdown...`);
  try {
    client.destroy();
    console.log('[OneBot] Discord client disconnected.');
  } catch (e) {
    // Ignore disconnect error
  }
  process.exit(0);
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// 9. Login to Discord Gateway (only when DISCORD_TOKEN is defined)
if (process.env.DISCORD_TOKEN && process.env.NODE_ENV !== 'test') {
  client.login(process.env.DISCORD_TOKEN).catch((err) => {
    console.error("❌ [OneBot Login Error] Failed to login to Discord Gateway:", err.message);
  });
}

export default client;
