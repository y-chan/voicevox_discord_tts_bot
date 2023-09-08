if (
  process.env.SHAREVOX_CORE === undefined ||
  process.env.BOT_TOKEN === undefined
) {
  throw Error('環境変数を設定してください')
}

import '@/src/db'

import {
  ActivityType,
  GatewayIntentBits,
  GuildMember,
  VoiceChannel,
} from 'discord.js'

import GuildSetting from '@/model/guildSetting'
import packageJson from '@/package.json'
import Client from '@/src/client'
import {
  CustomApplicationCommandData,
  getConnectionManager,
} from '@/src/command'

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildIntegrations,
  ],
})

client.on('messageCreate', async (message) => {
  if (message.author.bot) return
  await client.textToSpeechBot.messageCatcher(message)
})

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return
  try {
    await interaction.deferReply()
    const command = client.commandList.find(
      (v) => v.name === interaction.commandName
    ) as CustomApplicationCommandData
    const connectionManager = await getConnectionManager(interaction, client)
    await command.execute(interaction, connectionManager)
  } catch (e) {
    console.log(e)
  }
})

client.on('voiceStateUpdate', async (oldState, newState) => {
  const connectionManager = client.connectionManagers.get(oldState.guild.id)
  if (!connectionManager) return
  if (
    !oldState.channel &&
    newState.channelId === connectionManager.connection.joinConfig.channelId
  ) {
    const member = oldState.member as GuildMember
    connectionManager.readQueue.push({
      content: `${member.nickname || member.user.displayName}が入室しました`,
      userName: '',
    })
    await connectionManager.readText()
  } else if (
    oldState.channelId === connectionManager.connection.joinConfig.channelId &&
    !newState.channelId
  ) {
    if (
      oldState.channel instanceof VoiceChannel &&
      oldState.channel.members.size === 1
    ) {
      await client.textToSpeechBot.ttsModeOff(connectionManager)
    } else {
      const member = oldState.member as GuildMember
      connectionManager.readQueue.push({
        content: `${member.nickname || member.user.displayName}が退室しました`,
        userName: '',
      })
      await connectionManager.readText()
    }
  }
})

client.on('ready', async () => {
  console.log('botを正常に起動しました')
  client.user?.setActivity(`TTS Botだよ！(Ver: ${packageJson.version})`, {
    type: ActivityType.Playing,
  })
  await GuildSetting.sync()
  if (!client.application?.owner) await client.application?.fetch()
  const guild = await client.guilds.fetch('797151810174451762')
  await guild.commands.set(client.commandList)
  // await client.application!.commands.set(client.commandList)
})

void client.login(process.env.BOT_TOKEN)
