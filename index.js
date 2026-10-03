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

const commands = [
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banir um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("motivo")
        .setDescription("Motivo")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Silenciar um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro")
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
    .setDescription("Expulsar um membro")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("motivo")
        .setDescription("Motivo")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("castigo")
    .setDescription("Aplicar castigo")
    .addUserOption(o =>
      o.setName("membro")
        .setDescription("Membro")
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
    .setName("lock")
    .setDescription("Bloquear o canal"),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Desbloquear o canal"),

  new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Criar um embed")
    .addStringOption(o =>
      o.setName("titulo")
        .setDescription("Titulo")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("mensagem")
        .setDescription("Mensagem")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Criar painel de tickets")
];

function staff(member) {
  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels)
  );
}

function ticketPanel() {
  const embed = new EmbedBuilder()
    .setTitle("🎫 Atendimento")
    .setDescription(
      "Selecione abaixo o motivo do seu atendimento.\n\n" +
      "📮 **Denúncias**\n" +
      "Abusos xingamentos falas inapropriadas\n\n" +
      "❓ **Dúvidas**\n" +
      "Tire dúvidas Sobre o jogo Do servidor etc\n\n" +
      "🛒 **Compra**\n" +
      "Aqui você poderá comprar W ou até mesmo Nicks coloridos após abrir o ticket a resposta será direta sobre o valor dos produtos\n\n" +
      "🛡️ **Suporte**\n" +
      "Caso tenha bugs no jogo ou Algo do tipo abra q iremos resolver"
    );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_select")
    .setPlaceholder("Selecione o motivo")
    .addOptions(
      {
        label: "Denúncias",
        description: "Abusos, xingamentos e falas inapropriadas",
        value: "denuncias",
        emoji: "📮"
      },
      {
        label: "Dúvidas",
        description: "Duvidas sobre o jogo ou servidor",
        value: "duvidas",
        emoji: "❓"
      },
      {
        label: "Compra",
        description: "Compras e nicks coloridos",
        value: "compra",
        emoji: "🛒"
      },
      {
        label: "Suporte",
        description: "Bugs e problemas",
        value: "suporte",
        emoji: "🛡️"
      }
    );

  return {
    embeds: [embed],
    components: [
      new ActionRowBuilder().addComponents(menu)
    ]
  };
}

function ticketButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Fechar")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("staff_panel")
        .setLabel("Painel Staff")
        .setEmoji("🛡️")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("member_panel")
        .setLabel("Painel Membro")
        .setEmoji("👤")
        .setStyle(ButtonStyle.Secondary)
    )
  ];
}

function staffButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("add_member")
        .setLabel("Adicionar membro")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("remove_member")
        .setLabel("Retirar membro")
        .setEmoji("➖")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("notify_member")
        .setLabel("Notificar membro")
        .setEmoji("🔔")
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

function memberButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("notify_staff")
        .setLabel("Notificar staff")
        .setEmoji("🔔")
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

client.once("ready", async () => {
  console.log("BOT ONLINE: " + client.user.tag);

  try {
    const rest = new REST({ version: "10" })
      .setToken(process.env.DISCORD_TOKEN);

    await rest.put(
      Routes.applicationGuildCommands(
        client.user.id,
        process.env.GUILD_ID
      ),
      {
        body: commands.map(c => c.toJSON())
      }
    );

    console.log("COMANDOS REGISTRADOS");
  } catch (error) {
    console.error("ERRO NOS COMANDOS:", error);
  }
});

client.on("interactionCreate", async interaction => {
  try {

    if (interaction.isChatInputCommand()) {

      if (interaction.commandName === "ban") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        const member = interaction.options.getMember("membro");
        const reason =
          interaction.options.getString("motivo") ||
          "Sem motivo informado.";

        if (!member || !member.bannable) {
          return interaction.reply({
            content: "❌ Não posso banir esse membro.",
            ephemeral: true
          });
        }

        await member.ban({ reason });

        return interaction.reply(
          "🔨 " + member.user.tag + " foi banido.\nMotivo: " + reason
        );
      }

      if (interaction.commandName === "mute") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        const member = interaction.options.getMember("membro");
        const minutes = interaction.options.getInteger("minutos");
        const reason =
          interaction.options.getString("motivo") ||
          "Sem motivo informado.";

        if (!member || !member.moderatable) {
          return interaction.reply({
            content: "❌ Não posso silenciar esse membro.",
            ephemeral: true
          });
        }

        await member.timeout(minutes * 60000, reason);

        return interaction.reply(
          "🔇 " + member.user.tag +
          " foi silenciado por " + minutes +
          " minutos.\nMotivo: " + reason
        );
      }

      if (interaction.commandName === "expulsar") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        const member = interaction.options.getMember("membro");
        const reason =
          interaction.options.getString("motivo") ||
          "Sem motivo informado.";

        if (!member || !member.kickable) {
          return interaction.reply({
            content: "❌ Não posso expulsar esse membro.",
            ephemeral: true
          });
        }

        await member.kick(reason);

        return interaction.reply(
          "👢 " + member.user.tag + " foi expulso.\nMotivo: " + reason
        );
      }

      if (interaction.commandName === "castigo") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        const member = interaction.options.getMember("membro");
        const minutes = interaction.options.getInteger("minutos");
        const reason =
          interaction.options.getString("motivo") ||
          "Sem motivo informado.";

        if (!member || !member.moderatable) {
          return interaction.reply({
            content: "❌ Não posso aplicar castigo nesse membro.",
            ephemeral: true
          });
        }

        await member.timeout(
          minutes * 60000,
          "Castigo: " + reason
        );

        return interaction.reply(
          "⛔ " + member.user.tag +
          " recebeu castigo por " + minutes +
          " minutos.\nMotivo: " + reason
        );
      }

      if (interaction.commandName === "lock") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        await interaction.channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { SendMessages: false }
        );

        return interaction.reply("🔒 Canal bloqueado.");
      }

      if (interaction.commandName === "unlock") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        await interaction.channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone,
          { SendMessages: null }
        );

        return interaction.reply("🔓 Canal desbloqueado.");
      }

      if (interaction.commandName === "embed") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        const title = interaction.options.getString("titulo");
        const message = interaction.options.getString("mensagem");

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(message)
          .setTimestamp();

        await interaction.channel.send({
          embeds: [embed]
        });

        return interaction.reply({
          content: "✅ Embed enviado.",
          ephemeral: true
        });
      }

      if (interaction.commandName === "ticket") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode usar este comando.",
            ephemeral: true
          });
        }

        await interaction.channel.send(ticketPanel());

        return interaction.reply({
          content: "✅ Painel de tickets criado.",
          ephemeral: true
        });
      }
    }

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_select"
    ) {

      const existing = interaction.guild.channels.cache.find(
        channel =>
          channel.type === ChannelType.GuildText &&
          channel.topic === "ticket-" + interaction.user.id
      );

      if (existing) {
        return interaction.reply({
          content: "❌ Você já possui um ticket aberto: " + existing,
          ephemeral: true
        });
      }

      const reason = interaction.values[0];

      const channel = await interaction.guild.channels.create({
        name: "ticket-" + interaction.user.username
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 20),
        type: ChannelType.GuildText,
        topic: "ticket-" + interaction.user.id,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ]
      });

      for (const role of interaction.guild.roles.cache.values()) {
        if (
          role.permissions.has(PermissionFlagsBits.Administrator) ||
          role.permissions.has(PermissionFlagsBits.ManageChannels)
        ) {
          await channel.permissionOverwrites.edit(role.id, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });
        }
      }

      const names = {
        denuncias: "Denúncias",
        duvidas: "Dúvidas",
        compra: "Compra",
        suporte: "Suporte"
      };

      const embed = new EmbedBuilder()
        .setTitle("🎫 Ticket")
        .setDescription(
          "Olá " + interaction.user + "!\n\n" +
          "Seu ticket foi criado.\n\n" +
          "**Motivo:** " + names[reason] +
          "\n\nAguarde a staff atender você."
        );

      await channel.send({
        content: interaction.user.toString(),
        embeds: [embed],
        components: ticketButtons()
      });

      return interaction.reply({
        content: "✅ Ticket criado: " + channel,
        ephemeral: true
      });
    }

    if (interaction.isButton()) {

      if (interaction.customId === "ticket_close") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff tem permissão para fechar este ticket.",
            ephemeral: true
          });
        }

        await interaction.reply("🔒 Ticket será fechado em 3 segundos.");

        setTimeout(() => {
          interaction.channel.delete().catch(() => {});
        }, 3000);

        return;
      }

      if (interaction.customId === "staff_panel") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff pode abrir este painel.",
            ephemeral: true
          });
        }

        return interaction.reply({
          content: "🛡️ Painel Staff",
          components: staffButtons(),
          ephemeral: true
        });
      }

      if (interaction.customId === "member_panel") {
        return interaction.reply({
          content: "👤 Painel Membro",
          components: memberButtons(),
          ephemeral: true
        });
      }

      if (interaction.customId === "notify_staff") {
        await interaction.reply({
          content: "🔔 A staff foi notificada.",
          ephemeral: true
        });

        await interaction.channel.send(
          "🔔 **STAFF:** " +
          interaction.user +
          " está solicitando atendimento!"
        );

        return;
      }

      if (interaction.customId === "notify_member") {
        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff.",
            ephemeral: true
          });
        }

        const memberId =
          interaction.channel.topic?.replace("ticket-", "");

        if (memberId) {
          return interaction.reply(
            "🔔 <@" + memberId + "> a staff está chamando você!"
          );
        }

        return interaction.reply("🔔 Membro notificado.");
      }

      if (
        interaction.customId === "add_member" ||
        interaction.customId === "remove_member"
      ) {

        if (!staff(interaction.member)) {
          return interaction.reply({
            content: "❌ Apenas staff.",
            ephemeral: true
          });
        }

        const modal = new ModalBuilder()
          .setCustomId(
            interaction.customId === "add_member"
              ? "modal_add"
              : "modal_remove"
          )
          .setTitle(
            interaction.customId === "add_member"
              ? "Adicionar membro"
              : "Retirar membro"
          );

        const input = new TextInputBuilder()
          .setCustomId("user_id")
          .setLabel("ID do usuário")
          .setPlaceholder("Cole o ID do Discord")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(input)
        );

        return interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {

      const userId =
        interaction.fields.getTextInputValue("user_id").trim();

      if (!staff(interaction.member)) {
        return interaction.reply({
          content: "❌ Apenas staff.",
          ephemeral: true
        });
      }

      if (interaction.customId === "modal_add") {
        try {
          const member =
            await interaction.guild.members.fetch(userId);

          await interaction.channel.permissionOverwrites.edit(
            member.id,
            {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true
            }
          );

          return interaction.reply({
            content: "✅ Membro adicionado ao ticket.",
            ephemeral: true
          });
        } catch {
          return interaction.reply({
            content: "❌ ID de usuário inválido ou membro não encontrado.",
            ephemeral: true
          });
        }
      }

      if (interaction.customId === "modal_remove") {
        try {
          const member =
            await interaction.guild.members.fetch(userId);

          await interaction.channel.permissionOverwrites.delete(
            member.id
          );

          return interaction.reply({
            content: "✅ Membro retirado do ticket.",
            ephemeral: true
          });
        } catch {
          return interaction.reply({
            content: "❌ ID de usuário inválido ou membro não encontrado.",
            ephemeral: true
          });
        }
      }
    }

  } catch (error) {
    console.error("ERRO:", error);

    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "❌ Ocorreu um erro.",
        ephemeral: true
      }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
