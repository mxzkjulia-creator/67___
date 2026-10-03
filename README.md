# Bot de Aposta v3

O painel final segue o modelo solicitado:

- 🎮 Partida encontrada
- Mapa
- Modo
- Plataforma
- Valor por jogador
- Mediador
- 🔵 Time 1
- 🔴 Time 2
- Regras
- Botões **Venceu: Time 1** e **Venceu: Time 2**

### Votação
Somente staff pode clicar nos botões de vencedor.

Se um membro clicar, recebe:
**❌ Apenas staff pode votar.**

Não existe painel de votação separado para os membros.

### Comandos

`/painel`
- valor
- modo: 1v1 / 2v2 / 3v3
- plataforma: PC / Mobile / Misto
- mensagem

`/cancelar`
- somente staff
- fecha o canal

### Inatividade
Após 3 minutos sem atividade, o bot avisa que a staff pode usar `/cancelar`.
O bot não fecha sozinho por inatividade.

### Railway
Variables:
- DISCORD_TOKEN
- GUILD_ID

### Discord Developer Portal
Não é necessário OpenAI.
O bot precisa de permissões para:
- Ver canais
- Enviar mensagens
- Incorporar links/embeds
- Gerenciar canais (para /cancelar)
