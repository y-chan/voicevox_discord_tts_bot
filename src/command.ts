import {
  ApplicationCommandData,
  CommandInteraction,
  Guild,
  GuildMember,
} from 'discord.js'

import Client from '@/src/client'
import ConnectionManager from '@/src/connectionManager'
import TextToSpeechBot, { speakerList } from '@/src/textToSpeechBot'

export type CustomApplicationCommandData = ApplicationCommandData & {
  execute: (
    interaction: CommandInteraction,
    connectionManager: ConnectionManager | undefined | false
  ) => Promise<void>
}

export async function getConnectionManager(
  interaction: CommandInteraction,
  client: Client
): Promise<ConnectionManager | undefined | false> {
  const guildId = interaction.guildId
  if (!guildId) {
    await interaction.reply('コマンドはサーバー内でのみ実行可能です。')
    return false
  }
  if (!(interaction.member instanceof GuildMember)) {
    await interaction.reply('何か問題が発生したみたいです...')
    return false
  }
  return client.connectionManagers.get(guildId)
}

export function createCommandList(
  client: Client
): CustomApplicationCommandData[] {
  return [
    {
      name: 'voicevox',
      description:
        'Botを呼び出した人が参加しているボイスチャンネルに参加して、このコマンドを呼び出したチャンネルのメッセージを読み上げます。',
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        await client.textToSpeechBot.ttsModeOn(connectionManager, interaction)
      },
    },
    {
      name: 'vstop',
      description:
        'メッセージの読み上げが行われている場合に、それを終了します。',
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        await client.textToSpeechBot.ttsModeOff(connectionManager, interaction)
      },
    },
    {
      name: 'vvolume',
      description:
        '音量を設定できます。音量を入力しなかった場合は、今の音量を表示します。',
      options: [
        {
          name: 'value',
          type: 'INTEGER' as const,
          description: '音量を入力してください。ただし、範囲は1から100です。',
          required: false,
        },
      ],
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        const value = interaction.options.get('value')?.value
        if (value) {
          await client.textToSpeechBot.setVolume(
            connectionManager,
            interaction,
            value as string
          )
        } else {
          await client.textToSpeechBot.getVolume(connectionManager, interaction)
        }
      },
    },
    {
      name: 'vspeaker',
      description:
        '話者を設定できます。話者を選択しなかった場合は、今の話者を表示します。',
      options: [
        {
          name: 'speaker',
          type: 'INTEGER' as const,
          description: '話者を選択してください。',
          required: false,
          choices: speakerList,
        },
      ],
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        const speaker = interaction.options.get('speaker')?.value
        if (speaker !== undefined) {
          await client.textToSpeechBot.setSpeakerId(
            connectionManager,
            interaction,
            speaker as number
          )
        } else {
          await client.textToSpeechBot.getSpeakerId(
            connectionManager,
            interaction
          )
        }
      },
    },
    {
      name: 'vname',
      description:
        '名前を読み上げるか否かを設定できます。選択しなかった場合、今の設定を表示します。',
      options: [
        {
          name: 'name',
          type: 'BOOLEAN' as const,
          description: '読み上げるか否かを選択してください。',
          required: false,
        },
      ],
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        const name = interaction.options.get('name')?.value
        if (name !== undefined) {
          await client.textToSpeechBot.setReadName(
            connectionManager,
            interaction,
            name as boolean
          )
        } else {
          await client.textToSpeechBot.getReadName(
            connectionManager,
            interaction
          )
        }
      },
    },
  ]
}
