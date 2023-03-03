import {
  ApplicationCommandData,
  ApplicationCommandOptionType,
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
} from 'discord.js'

import Client from '@/src/client'
import ConnectionManager from '@/src/connectionManager'
import TextToSpeechBot, {
  priorityList,
  speakerList0,
  speakerList1,
} from '@/src/textToSpeechBot'

export type CustomApplicationCommandData = ApplicationCommandData & {
  execute: (
    interaction: ChatInputCommandInteraction,
    connectionManager: ConnectionManager | undefined | false
  ) => Promise<void>
}

export async function getConnectionManager(
  interaction: ChatInputCommandInteraction,
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
          type: ApplicationCommandOptionType.Integer,
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
        '話者を設定できます。話者を選択しなかった場合は、今の話者を表示します。話者リスト2が優先されます。',
      options: [
        {
          name: 'speaker',
          type: ApplicationCommandOptionType.Integer,
          description: '話者を選択してください(話者リスト1)。',
          required: false,
          choices: speakerList0,
        },
        {
          name: 'speaker1',
          type: ApplicationCommandOptionType.Integer,
          description: '話者を選択してください(話者リスト2)。',
          required: false,
          choices: speakerList1,
        },
      ],
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        const speaker = interaction.options.get('speaker')?.value
        const speaker1 = interaction.options.get('speaker1')?.value
        if (speaker1 !== undefined) {
          await client.textToSpeechBot.setSpeakerId(
            connectionManager,
            interaction,
            speaker1 as number
          )
        } else if (speaker !== undefined) {
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
      name: 'vspeed',
      description:
        '話速を設定できます。話速を入力しなかった場合は、今の話速を表示します。',
      options: [
        {
          name: 'value',
          type: ApplicationCommandOptionType.Integer,
          description: '話速を入力してください。ただし、範囲は50から200です。',
          required: false,
        },
      ],
      async execute(interaction, connectionManager) {
        if (connectionManager === false) return
        const value = interaction.options.get('value')?.value
        if (value) {
          await client.textToSpeechBot.setSpeakSpeed(
            connectionManager,
            interaction,
            value as string
          )
        } else {
          await client.textToSpeechBot.getSpeakSpeed(
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
          type: ApplicationCommandOptionType.Boolean,
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
    {
      name: 'vdict',
      description: '単語の読み上げ方を指定する辞書を操作出来ます。',
      options: [
        {
          name: 'show',
          type: ApplicationCommandOptionType.Subcommand,
          description: '現在登録されている単語一覧を表示します。',
        },
        {
          name: 'register',
          type: ApplicationCommandOptionType.Subcommand,
          description: '新しく単語を登録するか、更新します。',
          options: [
            {
              name: 'surface',
              type: ApplicationCommandOptionType.String,
              description: '単語を入力してください。',
              required: true,
            },
            {
              name: 'yomi',
              type: ApplicationCommandOptionType.String,
              description: '読みを入力してください。',
              required: true,
            },
            {
              name: 'priority',
              type: ApplicationCommandOptionType.Integer,
              description:
                '優先度を選択してください(単語が反映されないと感じた場合など)。',
              required: false,
              choices: priorityList,
            },
          ],
        },
        {
          name: 'delete',
          type: ApplicationCommandOptionType.Subcommand,
          description: '単語を削除します。',
          options: [
            {
              name: 'surface',
              type: ApplicationCommandOptionType.String,
              description: '単語を入力してください。',
              required: true,
            },
          ],
        },
      ],
      async execute(interaction, _) {
        const subCommand = interaction.options.getSubcommand()
        if (subCommand === 'show') {
          await client.textToSpeechBot.getWords(interaction)
        } else if (subCommand === 'register') {
          const surface = interaction.options.getString('surface')
          const yomi = interaction.options.getString('yomi')
          const priority = interaction.options.getInteger('priority')
          if (!surface || !yomi) {
            await interaction.reply({
              ephemeral: true,
              content: '単語もしくは読みの入力が不正です',
            })
            return
          }
          await client.textToSpeechBot.registerWord(
            interaction,
            surface,
            yomi,
            priority
          )
        } else if (subCommand === 'delete') {
          const surface = interaction.options.getString('surface')
          if (!surface) {
            await interaction.reply({
              ephemeral: true,
              content: '単語の入力が不正です',
            })
            return
          }
          await client.textToSpeechBot.deleteWord(interaction, surface)
        } else {
          await interaction.reply({
            ephemeral: true,
            content: 'コマンドが不正です',
          })
        }
      },
    },
  ]
}
