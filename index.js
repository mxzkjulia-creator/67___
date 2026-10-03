require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const matches = new Map();
const INACTIVITY_MS = 3 * 60 * 1000;

const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Cria uma fila de aposta.")
    .addStringOption(o => o.setName("valor").setDescription("Valor por jogador").setRequired(true))
    .addStringOption(o => o.setName("modo").setDescription("Modo da partida").setRequired(true)
      .addChoices(
        { name: "1v1", value: "1v1" },
        { name: "2v2", value: "2v2" },
        { name: "3v3", value: "3v3" }
      ))
    .addStringOption(o => o.setName("plataforma").setDescription("Plataforma").setRequired(true)
      .addChoices(
        { name: "PC", value: "PC" },
        { name: "Mobile", value: "Mobile" },
        { name: "Misto", value: "Misto" }
      ))
    .addStringOption(o => o.setName("mensagem").setDescription("Mensagem do painel").setRequired(true)),

  new SlashCommandBuilder()
    .setName("cancelar")
    .setDescription("Cancela a partida e fecha o canal.")
];

function isStaff(member) {
  return member.permissions.has(PermissionFlagsBits.ManageChannels) ||
         member.permissions.has(PermissionFlagsBits.Administrator);
}

function makeQueueEmbed(match) {
  const players = match.players.length
    ? match.players.map((id, i) => `${i + 1}. <@${id}>`).join("\n")
    : "_Ninguém na fila ainda_";

  return new EmbedBuilder()
    .setTitle("🎯 APOSTA")
    .setDescription(match.message)
    .addFields(
      { name: "🪙 Valor (por jogador)", value: `\`${match.value}\`` },
      { name: "⚔️ Modo", value: `**${match.mode}**`, inline: true },
      { name: "📱 Plataforma", value: `**${match.platform}**`, inline: true },
      { name: "🎮 Jogadores na fila", value: players }
    )
    .setColor(0x2ecc71)
    .setTimestamp();
}

function makeQueueButtons() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("entrar_aposta")
      .setLabel("Entrar na aposta")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("sair_aposta")
      .setLabel("Sair")
      .setStyle(ButtonStyle.Danger)
  )];
}

function makeMatchEmbed(match) {
  const rules = match.rules || [
    "Md3",
    "Full Soco ou o Emote que preferirem",
    "Colocar códigos no chat e pontuação",
    `Mapa escolhido: ${match.message || "Definido pela aposta"}`
  ];

  return new EmbedBuilder()
    .setTitle("🎮 Partida encontrada!")
    .setDescription(
      `**Mapa:** ${match.map || match.message}\n` +
      `**Modo:** ${match.mode} • **Plataforma:** ${match.platform}\n` +
      `**Valor (por jogador):** ${match.value}\n` +
      `**Mediador:** <@${match.mediatorId}>`
    )
    .addFields(
      {
        name: "🔵 Time 1",
        value: match.team1.map(id => `<@${id}>`).join("\n") || "—",
        inline: true
      },
      {
        name: "🔴 Time 2",
        value: match.team2.map(id => `<@${id}>`).join("\n") || "—",
        inline: true
      },
      {
        name: "📜 Regras",
        value: rules.map(r => `• ${r}`).join("\n")
      }
    )
    .setColor(0x2b2d31)
    .setTimestamp();
}

function makeStaffButtons() {
  return [new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("winner_t1")
      .setLabel("Venceu: Time 1")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("winner_t2")
      .setLabel("Venceu: Time 2")
      .setStyle(ButtonStyle.Success)
  )];
}

async function closeChannel(channel, reason) {
  await channel.send(`🔒 **Canal encerrado.**\n${reason}`).catch(() => {});
  setTimeout(() => channel.delete("Partida encerrada").catch(() => {}), 1200);
}

function startWatcher(match) {
  match.lastActivity = Date.now();

  match.timer = setInterval(async () => {
    if (match.closed) {
      clearInterval(match.timer);
      return;
    }

    if (Date.now() - match.lastActivity >= INACTIVITY_MS) {
      const channel = await client.channels.fetch(match.channelId).catch(() => null);
      if (!channel) return;

      await channel.send(
        "⚠️ **3 minutos sem atividade.** Se algum jogador estiver off ou não responder, a staff pode usar `/cancelar` para encerrar a partida."
      ).catch(() => {});

      // Não fecha sozinho: a staff decide.
      match.lastActivity = Date.now();
    }
  }, 15000);
}

client.once("ready", async () => {
  console.log(`✅ ${client.user.tag} online!`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const body = commands.map(c => c.toJSON());

  try {
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
        { body }
      );
    } else {
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body }
      );
    }
    console.log("✅ Comandos registrados.");
  } catch (error) {
    console.error("❌ Erro ao registrar comandos:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "painel") {
        const value = interaction.options.getString("valor");
        const mode = interaction.options.getString("modo");
        const platform = interaction.options.getString("plataforma");
        const message = interaction.options.getString("mensagem");

        const maxPlayers = Number(mode[0]) * 2;

        const match = {
          guildId: interaction.guildId,
          channelId: interaction.channelId,
          value,
          mode,
          platform,
          message,
          maxPlayers,
          players: [],
          team1: [],
          team2: [],
          mediatorId: interaction.user.id,
          closed: false
        };

        const msg = await interaction.channel.send({
          embeds: [makeQueueEmbed(match)],
          components: makeQueueButtons()
        });

        match.messageId = msg.id;
        matches.set(msg.id, match);
        startWatcher(match);

        return interaction.reply({
          content: "✅ Painel de aposta criado.",
          ephemeral: true
        });
      }

      if (interaction.commandName === "cancelar") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staffs podem usar este comando.",
            ephemeral: true
          });
        }

        const match = [...matches.values()].find(
          m => m.channelId === interaction.channelId && !m.closed
        );

        if (!match) {
          return interaction.reply({
            content: "❌ Não há uma partida ativa neste canal.",
            ephemeral: true
          });
        }

        match.closed = true;
        if (match.timer) clearInterval(match.timer);

        await interaction.reply({
          content: "🔒 Partida cancelada. Fechando o canal...",
          ephemeral: true
        });

        await closeChannel(interaction.channel, "A staff cancelou a partida.");
      }
    }

    if (interaction.isButton()) {
      const match = [...matches.values()].find(
        m => m.channelId === interaction.channelId && !m.closed
      );

      if (!match) {
        return interaction.reply({
          content: "❌ Esta partida não está mais ativa.",
          ephemeral: true
        });
      }

      match.lastActivity = Date.now();

      if (interaction.customId === "entrar_aposta") {
        if (match.players.includes(interaction.user.id)) {
          return interaction.reply({
            content: "Você já está na fila.",
            ephemeral: true
          });
        }

        if (match.players.length >= match.maxPlayers) {
          return interaction.reply({
            content: "❌ A fila já está cheia.",
            ephemeral: true
          });
        }

        match.players.push(interaction.user.id);

        if (match.players.length === match.maxPlayers) {
          const half = match.maxPlayers / 2;
          match.team1 = match.players.slice(0, half);
          match.team2 = match.players.slice(half);

          // O painel da fila é substituído pelo painel final.
          await interaction.update({
            embeds: [makeMatchEmbed(match)],
            components: makeStaffButtons()
          });

          await interaction.channel.send(
            "🎮 **Partida pronta!** Joguem e enviem o print do resultado aqui. **Apenas a staff pode votar no vencedor.**"
          );

          return;
        }

        return interaction.update({
          embeds: [makeQueueEmbed(match)],
          components: makeQueueButtons()
        });
      }

      if (interaction.customId === "sair_aposta") {
        const index = match.players.indexOf(interaction.user.id);

        if (index === -1) {
          return interaction.reply({
            content: "Você não está na fila.",
            ephemeral: true
          });
        }

        match.players.splice(index, 1);

        return interaction.update({
          embeds: [makeQueueEmbed(match)],
          components: makeQueueButtons()
        });
      }

      if (interaction.customId === "winner_t1" || interaction.customId === "winner_t2") {
        if (!isStaff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode votar.",
            ephemeral: true
          });
        }

        const winner = interaction.customId === "winner_t1" ? "Time 1" : "Time 2";

        await interaction.reply({
          content: `🏆 **${winner} venceu!** Resultado confirmado pela staff.`,
          ephemeral: false
        });

        // Mantém o painel visível para consulta.
        return;
      }
    }
  } catch (error) {
    console.error("❌ Erro:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocorreu um erro ao processar essa ação.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
