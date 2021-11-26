import {
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import {
  ApplicationCommandOptionChoice,
  ClientUser,
  CommandInteraction,
  GuildMember,
  Message,
  MessageEmbed,
  Snowflake,
} from 'discord.js'
import EventEmitter from 'events'
import Engine from 'node-voicevox-engine'

import GuildSetting from '@/model/guildSetting'
import Client from '@/src/client'
import ConnectionManager from '@/src/connectionManager'
import { sendReply } from '@/src/util'

export const speakerList: ApplicationCommandOptionChoice[] = [
  {
    name: '四国めたん(ノーマル)',
    value: 0,
  },
  {
    name: '四国めたん(あまあま)',
    value: 2,
  },
  {
    name: '四国めたん(セクシー)',
    value: 4,
  },
  {
    name: '四国めたん(ツンツン)',
    value: 6,
  },
  {
    name: 'ずんだもん(ノーマル)',
    value: 1,
  },
  {
    name: 'ずんだもん(あまあま)',
    value: 3,
  },
  {
    name: 'ずんだもん(セクシー)',
    value: 5,
  },
  {
    name: 'ずんだもん(ツンツン)',
    value: 7,
  },
  {
    name: '春日部つむぎ',
    value: 8,
  },
  {
    name: '波音リツ',
    value: 9,
  },
]

export default class TextToSpeechBot extends EventEmitter {
  public defaultVolume = 0.5
  public defaultSpeakerId = 0
  public engine: Engine

  constructor(public client: Client) {
    super()
    this.on('remove', (guildId: Snowflake) => {
      this.client.connectionManagers.delete(guildId)
    })
    this.engine = new Engine(process.env.VOICEVOX_CORE as string, false)
  }

  async sendEmbed(
    interaction: CommandInteraction,
    title: string,
    description?: string,
    license: boolean = true
  ): Promise<void> {
    const bot = this.client.user as ClientUser
    const embed = new MessageEmbed()
      .setTitle(title)
      .setAuthor(bot.username, bot.avatarURL() || '')
      .setFooter('Powered by VOICEVOX')
    if (description) embed.setDescription(description)
    if (license) {
      embed.addField(
        'ライセンス事項',
        '本BotのTTS機能は、ヒホ氏によって公開されている音声合成アプリケーションVOICEVOXの音声合成エンジンを利用しています。' +
          'YouTubeでのライブ配信等の際にこのBotを利用する場合は「VOICEVOX:四国めたん」や「VOICEVOX:ずんだもん」などの表記が必要となりますのでご注意ください。' +
          'また、TTSにおける文字列の解析等において、MeCab、NAIST Japanese Dictionary及びそれらを内包するOpenJTalkを用いています。'
      )
    }
    await sendReply(interaction, { embeds: [embed] })
  }

  async messageCatcher(message: Message): Promise<void> {
    const guildId = message.guildId
    if (!guildId) {
      return
    }
    const connectionManager = this.client.connectionManagers.get(guildId)
    if (message.channel.id === connectionManager?.calledInteraction.channelId) {
      await connectionManager.readText(message)
    }
  }

  async ttsModeOn(
    connectionManager: ConnectionManager | undefined,
    interaction: CommandInteraction
  ): Promise<void> {
    if (connectionManager) {
      await this.sendEmbed(
        interaction,
        'TTS機能は既に起動しています。',
        undefined,
        false
      )
    }

    const voiceChannel = (interaction.member as GuildMember | null)?.voice
      .channel
    if (voiceChannel) {
      const guildId = voiceChannel.guild.id
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: voiceChannel.guild
          .voiceAdapterCreator as DiscordGatewayAdapterCreator,
      })
      try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30e3)
        await this.sendEmbed(interaction, 'TTS機能を起動しました')

        const guildSetting = await GuildSetting.findOne({
          where: { guildId },
        })
        const dbFound = !!guildSetting
        let volume = this.defaultVolume
        let speakerId = this.defaultSpeakerId
        if (guildSetting) {
          volume = guildSetting.volume
          speakerId = guildSetting.speakerId
        }
        const connectionManager = new ConnectionManager(
          connection,
          dbFound,
          volume,
          speakerId,
          interaction,
          this
        )
        this.client.connectionManagers.set(guildId, connectionManager)
        await connectionManager.readText()
      } catch (e) {
        console.log(e)
        connection.destroy()
        this.client.connectionManagers.delete(guildId)
        await this.sendEmbed(
          interaction,
          '何か問題が発生したみたいです...',
          '再度同じ動作を試してみてください。それでもダメな場合は管理者にお問い合わせください。',
          false
        )
      }
    } else {
      await this.sendEmbed(
        interaction,
        '入室すべきボイスチャンネルが不明です。',
        '先にボイスチャンネルに入室した上で、再度コマンドを実行してください。',
        false
      )
    }
  }

  async ttsModeOff(
    connectionManager: ConnectionManager | undefined,
    interaction?: CommandInteraction
  ): Promise<void> {
    if (connectionManager) {
      if (interaction) connectionManager.calledInteraction = interaction
      connectionManager.readQueue.push({
        content: interaction ? 'TTS機能を停止します。' : '',
        userName: '',
        readEnd: true,
      })
      await connectionManager.readText()
    } else if (interaction) {
      await this.sendEmbed(
        interaction,
        'TTS機能は起動していません。',
        undefined,
        false
      )
    }
  }

  async setVolume(
    connectionManager: ConnectionManager | undefined,
    interaction: CommandInteraction,
    volumeText: string
  ): Promise<void> {
    if (connectionManager === undefined) {
      await this.sendEmbed(
        interaction,
        'Botがボイスチャンネルに接続されていません。',
        'Botをボイスチャンネルに接続してから再度お試しください。',
        false
      )
      return
    }

    const volume = parseInt(volumeText)
    if (isNaN(volume)) {
      await this.sendEmbed(
        interaction,
        '音量の設定に失敗しました。',
        '音量を設定しようとしましたが、入力されたものは数字ではないようです...\n1から100で設定してください。',
        false
      )
      return
    }
    if (volume < 1 || 100 < volume) {
      await this.sendEmbed(
        interaction,
        '音量の設定に失敗しました。',
        '音量は1から100で設定してください。',
        false
      )
    }
    connectionManager.volume = volume / 100
    if (connectionManager.resource) {
      connectionManager.resource.volume?.setVolume(connectionManager.volume)
    }
    const values = { volume: volume / 100 }
    if (connectionManager.dbFound) {
      await GuildSetting.update(values, {
        where: { guildId: connectionManager.connection.joinConfig.guildId },
      })
    } else {
      await GuildSetting.create({
        guildId: connectionManager.connection.joinConfig.guildId,
        ...values,
      })
      connectionManager.dbFound = true
    }
    await this.sendEmbed(
      interaction,
      `ボリュームを${volume}に設定しました！`,
      undefined,
      false
    )
  }

  async getVolume(
    connectionManager: ConnectionManager | undefined,
    interaction: CommandInteraction
  ): Promise<void> {
    if (connectionManager === undefined) {
      await this.sendEmbed(
        interaction,
        'Botがボイスチャンネルに接続されていません。',
        'Botをボイスチャンネルに接続してから再度お試しください。',
        false
      )
      return
    }
    await this.sendEmbed(
      interaction,
      `現在のボリュームは${connectionManager.volume * 100}です。`,
      undefined,
      false
    )
  }

  async setSpeakerId(
    connectionManager: ConnectionManager | undefined,
    interaction: CommandInteraction,
    speakerId: number
  ): Promise<void> {
    if (connectionManager === undefined) {
      await this.sendEmbed(
        interaction,
        'Botがボイスチャンネルに接続されていません。',
        'Botをボイスチャンネルに接続してから再度お試しください。',
        false
      )
      return
    }

    connectionManager.speakerId = speakerId
    const values = { speakerId }
    if (connectionManager.dbFound) {
      await GuildSetting.update(values, {
        where: { guildId: connectionManager.connection.joinConfig.guildId },
      })
    } else {
      await GuildSetting.create({
        guildId: connectionManager.connection.joinConfig.guildId,
        ...values,
      })
      connectionManager.dbFound = true
    }

    const speakerName = speakerList.find(
      (value) => value.value === speakerId
    )!.name
    await this.sendEmbed(
      interaction,
      `話者を\`${speakerName}\`に設定しました！`,
      undefined,
      false
    )
  }

  async getSpeakerId(
    connectionManager: ConnectionManager | undefined,
    interaction: CommandInteraction
  ): Promise<void> {
    if (connectionManager === undefined) {
      await this.sendEmbed(
        interaction,
        'Botがボイスチャンネルに接続されていません。',
        'Botをボイスチャンネルに接続してから再度お試しください。',
        false
      )
      return
    }

    const speakerName = speakerList.find(
      (value) => value.value === connectionManager.speakerId
    )!.name
    await this.sendEmbed(
      interaction,
      `現在の話者は\`${speakerName}\`です。`,
      undefined,
      false
    )
  }
}
