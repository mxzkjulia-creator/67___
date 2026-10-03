require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits,
  ChannelType,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

/* =========================
   COMANDOS
========================= */

const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bane um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro que sera banido")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("motivo")
        .setDescription("Motivo do banimento")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silencia um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro que sera silenciado")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutos")
        .setDescription("Tempo em minutos")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)
    )
    .addStringOption(o =>
      o.setName("motivo")
        .setDescription("Motivo")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("expulsar")
    .setDescription("Expulsa um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro que sera expulso")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("motivo")
        .setDescription("Motivo")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("castigo")
    .setDescription("Aplica castigo a um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutos
