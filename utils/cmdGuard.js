/**
 * OneBot by HyperSoft
 * Command Guard & Permission Validator (ES Module)
 */

import { getPrefix } from './settings.js';

export async function canExecute(context, commandSpec = {}) {
  if (!context || !context.guild) {
    if (commandSpec.guildOnly !== false) {
      return {
        allowed: false,
        reason: "هذا الأمر متاح فقط داخل السيرفرات."
      };
    }
    return { allowed: true, prefix: "!" };
  }

  const guild = context.guild;
  const guildId = guild.id;
  const prefix = await getPrefix(guildId);
  const userId = context.user ? context.user.id : context.author?.id;
  const member = context.member;

  if (commandSpec.botPermissions && guild.members?.me) {
    for (const perm of commandSpec.botPermissions) {
      if (!guild.members.me.permissions.has(perm)) {
        return {
          allowed: false,
          reason: `البوت يفتقر إلى الصلاحية المطلوبة في هذا السيرفر: ${perm}`
        };
      }
    }
  }

  if (commandSpec.userPermissions && member) {
    // Owner bypass
    if (guild.ownerId !== userId) {
      for (const perm of commandSpec.userPermissions) {
        if (!member.permissions.has(perm)) {
          return {
            allowed: false,
            reason: `أنت تفتقر إلى الصلاحية المطلوبة لتنفيذ هذا الأمر: ${perm}`
          };
        }
      }
    }
  }

  return {
    allowed: true,
    prefix,
    guildId
  };
}

export default { canExecute };
