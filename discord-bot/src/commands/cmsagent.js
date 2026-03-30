// /cmsagent slash command — CMS agent content editing via Discord
import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} from 'discord.js';
import { resolveFromUrl, resolveFromSlug, getSiteChoices } from '../services/sites.js';
import { agentChat, agentCommit } from '../services/graphql.js';
import { getToken, refreshToken } from '../services/auth.js';

const CMS_ROLE_NAME = process.env.DISCORD_CMS_ROLE_NAME || 'CMS Admin';
const BUTTON_TIMEOUT = 5 * 60 * 1000; // 5 minutes

/** Build the slash command definition */
export const data = new SlashCommandBuilder()
  .setName('cmsagent')
  .setDescription('Edit portfolio site content using the CMS AI agent')
  .addStringOption((opt) =>
    opt.setName('changes').setDescription('What changes to make (natural language)').setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('url')
      .setDescription('Full URL of the page to edit (e.g. https://fernando-vargas.com/about)')
      .setRequired(false)
  )
  .addStringOption((opt) =>
    opt
      .setName('site')
      .setDescription('Pick a site (alternative to URL)')
      .setRequired(false)
      .addChoices(...getSiteChoices())
  )
  .addStringOption((opt) =>
    opt
      .setName('page')
      .setDescription('Page path (e.g. /about, /blog/my-post). Defaults to /')
      .setRequired(false)
  );

/** Handle the /cmsagent interaction */
export async function execute(interaction) {
  // Role check
  const hasRole = interaction.member.roles.cache.some(
    (role) => role.name.toLowerCase() === CMS_ROLE_NAME.toLowerCase()
  );

  if (!hasRole) {
    return interaction.reply({
      content: `You need the **${CMS_ROLE_NAME}** role to use this command.`,
      ephemeral: true,
    });
  }

  // Parse options
  const changes = interaction.options.getString('changes');
  const url = interaction.options.getString('url');
  const site = interaction.options.getString('site');
  const page = interaction.options.getString('page') || '/';

  // Resolve target portfolio
  let target = null;

  if (url) {
    target = resolveFromUrl(url);
    if (!target) {
      return interaction.reply({
        content: `Could not resolve a portfolio site from URL: \`${url}\`\nKnown domains: fernando-vargas.com, jessicasutherland.me, thebusybeeweb.com, 1stopwings.executivecateringct.com, executivecateringct.fernando-vargas.com, opsblueprint.fernando-vargas.com`,
        ephemeral: true,
      });
    }
  } else if (site) {
    target = resolveFromSlug(site, page);
    if (!target) {
      return interaction.reply({
        content: `Unknown site: \`${site}\``,
        ephemeral: true,
      });
    }
  } else {
    return interaction.reply({
      content: 'You must provide either a **url** or a **site** to target. Use `/cmsagent` and fill in at least one.',
      ephemeral: true,
    });
  }

  // Defer reply — agent call can take a while
  await interaction.deferReply();

  try {
    // Get JWT token (auto-login/refresh)
    let token;
    try {
      token = await getToken();
    } catch (authErr) {
      console.error('[CmsAgent] Auth error:', authErr.message);
      return interaction.editReply({
        content: 'Failed to authenticate with the CMS backend. Check bot configuration.',
      });
    }

    // Call the CMS agent
    console.log(
      `[CmsAgent] ${interaction.user.tag} -> ${target.portfolioName} ${target.route}: "${changes}"`
    );

    let result;
    try {
      result = await agentChat({
        token,
        portfolioId: target.portfolioId,
        message: changes,
        currentRoute: target.route,
      });
    } catch (err) {
      // If 401/auth error, try refreshing token once
      if (err.message.includes('Auth') || err.message.includes('401') || err.message.includes('Unauthorized')) {
        console.log('[CmsAgent] Token may be expired, refreshing...');
        token = await refreshToken();
        result = await agentChat({
          token,
          portfolioId: target.portfolioId,
          message: changes,
          currentRoute: target.route,
        });
      } else {
        throw err;
      }
    }

    // Build response embed
    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord blurple
      .setTitle('CMS Agent Response')
      .setDescription(truncate(result.message, 4000))
      .addFields(
        { name: 'Site', value: target.portfolioName, inline: true },
        { name: 'Page', value: target.route, inline: true }
      )
      .setTimestamp()
      .setFooter({ text: `Session: ${result.sessionId?.substring(0, 8) || 'N/A'}` });

    // Add proposed changes
    if (result.proposedChanges && result.proposedChanges.length > 0) {
      const changesText = result.proposedChanges
        .map((c, i) => {
          const old = formatValue(c.oldValue);
          const newVal = formatValue(c.newValue);
          return `**${i + 1}.** \`${c.entityType}\` > \`${c.fieldPath}\`\n${c.description}\n\`\`\`diff\n- ${old}\n+ ${newVal}\n\`\`\``;
        })
        .join('\n');

      embed.addFields({
        name: `Proposed Changes (${result.proposedChanges.length})`,
        value: truncate(changesText, 1024),
      });

      // Add commit/cancel buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('cms_commit')
          .setLabel('Commit Changes')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setCustomId('cms_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
      );

      const reply = await interaction.editReply({
        embeds: [embed],
        components: [row],
      });

      // Wait for button interaction
      try {
        const btnInteraction = await reply.awaitMessageComponent({
          componentType: ComponentType.Button,
          filter: (i) => i.user.id === interaction.user.id,
          time: BUTTON_TIMEOUT,
        });

        if (btnInteraction.customId === 'cms_commit') {
          await btnInteraction.deferUpdate();

          // Commit the changes
          try {
            const commitResult = await agentCommit({
              token,
              portfolioId: target.portfolioId,
              changes: result.proposedChanges,
            });

            if (commitResult.success) {
              embed.setColor(0x57f287); // Green
              embed.addFields({
                name: 'Status',
                value: '**Committed successfully!** Changes are now live.',
              });
            } else {
              const failures = commitResult.results
                .filter((r) => !r.success)
                .map((r) => `- ${r.changeId}: ${r.error}`)
                .join('\n');

              embed.setColor(0xed4245); // Red
              embed.addFields({
                name: 'Commit Failed',
                value: truncate(
                  commitResult.error || failures || 'Unknown error',
                  1024
                ),
              });
            }
          } catch (commitErr) {
            console.error('[CmsAgent] Commit error:', commitErr.message);
            embed.setColor(0xed4245);
            embed.addFields({
              name: 'Commit Error',
              value: truncate(commitErr.message, 1024),
            });
          }

          await btnInteraction.editReply({ embeds: [embed], components: [] });
        } else {
          // Cancel
          await btnInteraction.deferUpdate();
          embed.setColor(0x95a5a6); // Grey
          embed.addFields({ name: 'Status', value: 'Changes discarded.' });
          await btnInteraction.editReply({ embeds: [embed], components: [] });
        }
      } catch {
        // Timeout — no button clicked
        embed.setColor(0x95a5a6);
        embed.addFields({
          name: 'Status',
          value: 'Changes expired (no response within 5 minutes). Re-run the command to try again.',
        });
        await interaction.editReply({ embeds: [embed], components: [] });
      }
    } else {
      // No proposed changes — just show the agent's response
      embed.setColor(0xfee75c); // Yellow — informational
      embed.addFields({
        name: 'Proposed Changes',
        value: 'No content changes were proposed. The agent may need more specific instructions.',
      });
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    console.error('[CmsAgent] Error:', err);
    await interaction.editReply({
      content: `An error occurred while processing your request:\n\`\`\`\n${truncate(err.message, 1900)}\n\`\`\``,
    });
  }
}

/** Truncate a string to a max length, adding ellipsis */
function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}

/** Format a JSON value for display in the diff block */
function formatValue(val) {
  if (!val) return '(empty)';
  try {
    // Try to parse JSON and format nicely
    const parsed = JSON.parse(val);
    if (typeof parsed === 'string') return parsed;
    return JSON.stringify(parsed);
  } catch {
    return val;
  }
}
