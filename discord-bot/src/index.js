// Discord bot entry point
// Initializes the Discord client, registers slash commands, routes interactions
import { Client, GatewayIntentBits, Collection, REST, Routes } from 'discord.js';
import { startHealthServer, setDiscordClient } from './utils/health.js';
import { getToken } from './services/auth.js';

// Import commands
import * as cmsagentCommand from './commands/cmsagent.js';
import * as workflowCommand from './commands/workflow.js';

// Config
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const HEALTH_PORT = parseInt(process.env.HEALTH_PORT || '3100', 10);

if (!BOT_TOKEN) {
  console.error('[Bot] DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

if (!GUILD_ID) {
  console.error('[Bot] DISCORD_GUILD_ID environment variable is required');
  process.exit(1);
}

// Create Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Register commands in a collection
const commands = new Collection();
commands.set(cmsagentCommand.data.name, cmsagentCommand);
commands.set(workflowCommand.data.name, workflowCommand);

/**
 * Register slash commands with Discord API (guild-scoped for instant availability)
 */
async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);
  const commandData = [cmsagentCommand.data.toJSON(), workflowCommand.data.toJSON()];

  try {
    console.log(`[Bot] Registering ${commandData.length} slash commands for guild ${GUILD_ID}...`);
    const result = await rest.put(Routes.applicationGuildCommands(client.user.id, GUILD_ID), {
      body: commandData,
    });
    console.log(`[Bot] Successfully registered ${result.length} slash commands.`);
  } catch (err) {
    console.error('[Bot] Failed to register slash commands:', err);
  }
}

// Handle interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[Bot] Unknown command: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(`[Bot] Error executing /${interaction.commandName}:`, err);

    const errorMsg = 'An unexpected error occurred. Please try again.';
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMsg }).catch(() => {});
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
});

// Bot ready
client.once('ready', async () => {
  console.log(`[Bot] Logged in as ${client.user.tag} (${client.user.id})`);
  console.log(`[Bot] Serving ${client.guilds.cache.size} guild(s)`);

  // Set health client reference
  setDiscordClient(client);

  // Register slash commands
  await registerCommands();

  // Pre-warm CMS auth token
  try {
    await getToken();
    console.log('[Bot] CMS backend authentication successful.');
  } catch (err) {
    console.warn(`[Bot] CMS auth pre-warm failed (will retry on first command): ${err.message}`);
  }

  console.log('[Bot] Ready! Listening for slash commands.');
});

// Error handling
client.on('error', (err) => {
  console.error('[Bot] Client error:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[Bot] Unhandled rejection:', err);
});

process.on('SIGTERM', () => {
  console.log('[Bot] Received SIGTERM, shutting down...');
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Bot] Received SIGINT, shutting down...');
  client.destroy();
  process.exit(0);
});

// Start health server
startHealthServer(HEALTH_PORT);

// Login to Discord
console.log('[Bot] Starting Portfolio Discord Bot...');
client.login(BOT_TOKEN);
