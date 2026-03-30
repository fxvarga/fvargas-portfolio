// /workflow slash command — scaffold for triggering n8n workflows from Discord
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const N8N_WEBHOOK_BASE_URL = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678/webhook';
const CMS_ROLE_NAME = process.env.DISCORD_CMS_ROLE_NAME || 'CMS Admin';

/** Build the slash command definition */
export const data = new SlashCommandBuilder()
  .setName('workflow')
  .setDescription('Trigger an n8n workflow (coming soon)')
  .addStringOption((opt) =>
    opt
      .setName('name')
      .setDescription('Workflow name to trigger')
      .setRequired(true)
      .addChoices(
        { name: 'Catering Lead Intake', value: 'catering-lead' },
        { name: 'OpsBlueprint Lead Intake', value: 'opsblueprint-lead' }
      )
  )
  .addStringOption((opt) =>
    opt
      .setName('data')
      .setDescription('JSON data to pass to the workflow')
      .setRequired(false)
  );

/** Handle the /workflow interaction */
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

  const name = interaction.options.getString('name');
  const dataStr = interaction.options.getString('data');

  const embed = new EmbedBuilder()
    .setColor(0xfee75c) // Yellow
    .setTitle('Workflow Trigger')
    .setDescription(
      'Workflow triggering from Discord is coming soon!\n\n' +
        'When activated, this command will POST to n8n webhooks to trigger automated workflows.'
    )
    .addFields(
      { name: 'Workflow', value: `\`${name}\``, inline: true },
      { name: 'Endpoint', value: `\`${N8N_WEBHOOK_BASE_URL}/${name}\``, inline: false }
    )
    .setTimestamp()
    .setFooter({ text: 'Scaffold — not yet connected' });

  if (dataStr) {
    embed.addFields({ name: 'Data', value: `\`\`\`json\n${dataStr}\n\`\`\`` });
  }

  // When ready to activate, uncomment this:
  // await interaction.deferReply();
  // try {
  //   const payload = {
  //     source: 'discord',
  //     user: interaction.user.tag,
  //     userId: interaction.user.id,
  //     data: dataStr ? JSON.parse(dataStr) : {},
  //   };
  //   const response = await fetch(`${N8N_WEBHOOK_BASE_URL}/${name}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(payload),
  //   });
  //   // Handle response...
  // } catch (err) {
  //   // Handle error...
  // }

  await interaction.reply({ embeds: [embed] });
}
