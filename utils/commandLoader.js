/**
 * OneBot by HyperSoft
 * Dynamic Command Loader (ES Module)
 * 
 * Recursively scans commands/ directory and registers all real Slash Commands.
 * Skips internal helper files starting with '_'.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const COMMANDS_DIR = path.resolve(__dirname, '../commands');

export async function loadCommands(client) {
  if (!client.commands) {
    throw new Error('CommandLoader: client.commands Collection must be initialized.');
  }

  client.commands.clear();
  const loadedList = [];

  async function scanDirectory(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await scanDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.startsWith('_')) {
        try {
          const fileUrl = pathToFileURL(fullPath).href;
          const commandModule = await import(fileUrl);
          const command = commandModule.default || commandModule;

          if (command?.data?.name && typeof command.execute === 'function') {
            client.commands.set(command.data.name, command);
            loadedList.push(command.data.name);
          }
        } catch (err) {
          console.error(`[CommandLoader] Failed to load command at ${fullPath}:`, err.message);
        }
      }
    }
  }

  if (fs.existsSync(COMMANDS_DIR)) {
    await scanDirectory(COMMANDS_DIR);
  }

  console.log(`[Commands] Loaded ${client.commands.size} application commands: [${loadedList.join(', ')}]`);
  return client.commands;
}

export default loadCommands;
