/**
 * OneBot by HyperSoft
 * Discord Application Command Registration Engine
 * 
 * Registers dynamic Slash Commands using Discord.js REST and Routes API.
 */

import { REST, Routes } from 'discord.js';

export async function deployCommands(client) {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID || client?.user?.id;

  if (!token || process.env.NODE_ENV === 'test' || token.startsWith('mock_')) {
    console.log('[Commands] Skipping Discord REST registration (Test or missing token environment).');
    return { success: true, count: client?.commands?.size || 0, skipped: true };
  }

  if (!clientId) {
    console.warn('[Commands] Warning: DISCORD_CLIENT_ID or client.user.id not available. Cannot deploy slash commands.');
    return { success: false, reason: 'missing_client_id' };
  }

  const commandsJson = [];
  for (const [, cmd] of client.commands.entries()) {
    if (cmd.data && typeof cmd.data.toJSON === 'function') {
      commandsJson.push(cmd.data.toJSON());
    }
  }

  console.log(`[Commands] Registering ${commandsJson.length} application commands to Discord REST API...`);

  const rest = new REST({ version: '10' }).setToken(token);

  try {
    // Register globally or per-guild during development
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commandsJson }
    );

    console.log(`[Commands] Successfully registered ${Array.isArray(data) ? data.length : commandsJson.length} application commands.`);
    return { success: true, count: commandsJson.length };
  } catch (error) {
    console.error('❌ [Commands] Error registering application commands with Discord REST:', error.message);
    return { success: false, error: error.message };
  }
}

export default deployCommands;
