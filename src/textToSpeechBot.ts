import {
  DiscordGatewayAdapterCreator,
  entersState,
  joinVoiceChannel,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import {
  ApplicationCommandOptionChoiceData,
  ChatInputCommandInteraction,
  ClientUser,
  EmbedBuilder,
  GuildMember,
  Message,
  Snowflake,
} from 'discord.js'
import EventEmitter from 'events'
import Engine, { AccentPhrase } from 'node-voicevox-engine'

import GuildSetting from '@/model/guildSetting'
import Client from '@/src/client'
import ConnectionManager from '@/src/connectionManager'
import {
  convertHankakuToZenkaku,
  convertHiraToKana,
  convertLongVowel,
  kanaRegex,
  sendReply,
  sleep,
} from '@/src/util'

export const speakerList0: ApplicationCommandOptionChoiceData<number>[] = [
  {
    name: '四国めたん(ノーマル)',
    value: 2,
  },
  {
    name: '四国めたん(あまあま)',
    value: 0,
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
    name: '四国めたん(ささやき)',
    value: 36,
  },
  {
    name: '四国めたん(ヒソヒソ)',
    value: 37,
  },
  {
    name: 'ずんだもん(ノーマル)',
    value: 3,
  },
  {
    name: 'ずんだもん(あまあま)',
    value: 1,
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
    name: 'ずんだもん(ささやき)',
    value: 22,
  },
  {
    name: 'ずんだもん(ヒソヒソ)',
    value: 38,
  },
  {
    name: '春日部つむぎ',
    value: 8,
  },
  {
    name: '波音リツ',
    value: 9,
  },
  {
    name: '雨晴はう',
    value: 10,
  },
  {
    name: '玄野武宏(ノーマル)',
    value: 11,
  },
  {
    name: '玄野武宏(喜び)',
    value: 39,
  },
  {
    name: '玄野武宏(ツンギレ)',
    value: 40,
  },
  {
    name: '玄野武宏(悲しみ)',
    value: 41,
  },
  {
    name: '白上虎太郎(ふつう)',
    value: 12,
  },
  {
    name: '白上虎太郎(わーい)',
    value: 32,
  },
  {
    name: '白上虎太郎(びくびく)',
    value: 33,
  },
  {
    name: '白上虎太郎(おこ)',
    value: 34,
  },
  {
    name: '白上虎太郎(びえーん)',
    value: 35,
  },
]

export const speakerList1: ApplicationCommandOptionChoiceData<number>[] = [
  {
    name: '青山龍星',
    value: 13,
  },
  {
    name: '冥鳴ひまり',
    value: 14,
  },
  {
    name: '九州そら(ノーマル)',
    value: 16,
  },
  {
    name: '九州そら(あまあま)',
    value: 15,
  },
  {
    name: '九州そら(セクシー)',
    value: 17,
  },
  {
    name: '九州そら(ツンツン)',
    value: 18,
  },
  {
    name: '九州そら(ささやき)',
    value: 19,
  },
  {
    name: 'もち子さん',
    value: 20,
  },
  {
    name: '剣崎雌雄',
    value: 21,
  },
  {
    name: 'WhiteCUL(ノーマル)',
    value: 23,
  },
  {
    name: 'WhiteCUL(たのしい)',
    value: 24,
  },
  {
    name: 'WhiteCUL(かなしい)',
    value: 25,
  },
  {
    name: 'WhiteCUL(びえーん)',
    value: 26,
  },
  {
    name: '後鬼(人間ver.)',
    value: 27,
  },
  {
    name: '後鬼(ぬいぐるみver.)',
    value: 28,
  },
  {
    name: 'No.7(ノーマル)',
    value: 29,
  },
  {
    name: 'No.7(アナウンス)',
    value: 30,
  },
  {
    name: 'No.7(読み聞かせ)',
    value: 31,
  },
]

export const speakerList2: ApplicationCommandOptionChoiceData<number>[] = [
  {
    name: 'ちび式じい',
    value: 42,
  },
  {
    name: '櫻歌ミコ(ノーマル)',
    value: 43,
  },
  {
    name: '櫻歌ミコ(第二形態)',
    value: 44,
  },
  {
    name: '櫻歌ミコ(ロリ)',
    value: 45,
  },
  {
    name: '小夜/SAYO',
    value: 46,
  },
  {
    name: 'ナースロボ＿タイプＴ(ノーマル)',
    value: 47,
  },
  {
    name: 'ナースロボ＿タイプＴ(楽々)',
    value: 48,
  },
  {
    name: 'ナースロボ＿タイプＴ(恐怖)',
    value: 49,
  },
  {
    name: 'ナースロボ＿タイプＴ(内緒話)',
    value: 50,
  },
  {
    name: '†聖騎士 紅桜†',
    value: 51,
  },
  {
    name: '雀松朱司',
    value: 52,
  },
  {
    name: '麒ヶ島宗麟',
    value: 53,
  },
  {
    name: '春歌ナナ',
    value: 54,
  },
  {
    name: '猫使アル(ノーマル)',
    value: 55,
  },
  {
    name: '猫使アル(おちつき)',
    value: 56,
  },
  {
    name: '猫使アル(うきうき)',
    value: 57,
  },
  {
    name: '猫使ビィ(ノーマル)',
    value: 58,
  },
  {
    name: '猫使ビィ(おちつき)',
    value: 59,
  },
  {
    name: '猫使ビィ(人見知り)',
    value: 60,
  },
]

export const priorityList: ApplicationCommandOptionChoiceData<number>[] = [
  {
    name: '最低',
    value: 0,
  },
  {
    name: '低',
    value: 2,
  },
  {
    name: '標準',
    value: 5,
  },
  {
    name: '高',
    value: 8,
  },
  {
    name: '最高',
    value: 10,
  },
]

export default class TextToSpeechBot extends EventEmitter {
  public defaultVolume = 0.5
  public defaultSpeakerId = 0
  public defaultSpeakSpeed = 1.0
  public defaultName = true
  public engine: Engine

  constructor(public client: Client) {
    super()
    this.on('remove', (guildId: Snowflake) => {
      this.client.connectionManagers.delete(guildId)
    })
    this.engine = new Engine(process.env.VOICEVOX_CORE as string, false)
  }

  async sendEmbed(
    interaction: ChatInputCommandInteraction,
    title: string,
    description?: string,
    license: boolean = true
  ): Promise<void> {
    const bot = this.client.user as ClientUser
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setAuthor({
        name: bot.username,
        url: bot.avatarURL() || undefined,
      })
      .setFooter({
        text: 'Powered by VOICEVOX',
        iconURL: 'https://avatars.githubusercontent.com/u/95246571',
      })
    if (description) embed.setDescription(description)
    if (license) {
      embed.addFields({
        name: 'ライセンス事項',
        value:
          '本BotのTTS機能は、ヒホ氏によって公開されている音声合成アプリケーションVOICEVOXの音声合成エンジンを利用しています。' +
          'YouTubeでのライブ配信等の際にこのBotを利用する場合は「VOICEVOX:四国めたん」や「VOICEVOX:ずんだもん」などの表記が必要となりますのでご注意ください。' +
          'また、TTSにおける文字列の解析等において、MeCab、NAIST Japanese Dictionary及びそれらを内包するOpenJTalkを用いています。',
      })
    }
    try {
      await sendReply(interaction, { embeds: [embed] })
    } catch (e) {
      console.log(e)
    }
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
    interaction: ChatInputCommandInteraction
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
        let speakSpeed = this.defaultSpeakSpeed
        let name = this.defaultName
        if (guildSetting) {
          volume = guildSetting.volume
          speakerId = guildSetting.speakerId
          speakSpeed = guildSetting.speakSpeed
          name = guildSetting.name
        }
        const connectionManager = new ConnectionManager(
          connection,
          dbFound,
          volume,
          speakerId,
          speakSpeed,
          name,
          interaction,
          this
        )
        this.client.connectionManagers.set(guildId, connectionManager)
        await sleep(1000)
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
    interaction?: ChatInputCommandInteraction
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
    interaction: ChatInputCommandInteraction,
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
    interaction: ChatInputCommandInteraction
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
    interaction: ChatInputCommandInteraction,
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

    let speaker = speakerList0.find((value) => value.value === speakerId)
    if (!speaker) {
      speaker = speakerList1.find((value) => value.value === speakerId)
      if (!speaker) {
        speaker = speakerList2.find((value) => value.value === speakerId)
      }
    }
    const speakerName = speaker!.name

    await this.sendEmbed(
      interaction,
      `話者を\`${speakerName}\`に設定しました！`,
      undefined,
      false
    )
  }

  async getSpeakerId(
    connectionManager: ConnectionManager | undefined,
    interaction: ChatInputCommandInteraction
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

    let speaker = speakerList0.find(
      (value) => value.value === connectionManager.speakerId
    )
    if (!speaker) {
      speaker = speakerList1.find(
        (value) => value.value === connectionManager.speakerId
      )
      if (!speaker) {
        speaker = speakerList2.find(
          (value) => value.value === connectionManager.speakerId
        )
      }
    }
    const speakerName = speaker!.name
    await this.sendEmbed(
      interaction,
      `現在の話者は\`${speakerName}\`です。`,
      undefined,
      false
    )
  }

  async setSpeakSpeed(
    connectionManager: ConnectionManager | undefined,
    interaction: ChatInputCommandInteraction,
    speakSpeedText: string
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

    const speakSpeed = parseInt(speakSpeedText)
    if (isNaN(speakSpeed)) {
      await this.sendEmbed(
        interaction,
        '話速の設定に失敗しました。',
        '話速を設定しようとしましたが、入力されたものは数字ではないようです...\n0.5から2で設定してください。',
        false
      )
      return
    }
    if (speakSpeed < 50 || 200 < speakSpeed) {
      await this.sendEmbed(
        interaction,
        '話速の設定に失敗しました。',
        '話速は50から200で設定してください。',
        false
      )
    }

    connectionManager.speakSpeed = speakSpeed / 100
    const values = { speakSpeed: speakSpeed / 100 }
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
      `話速を${speakSpeed}%に設定しました！`,
      undefined,
      false
    )
  }

  async getSpeakSpeed(
    connectionManager: ConnectionManager | undefined,
    interaction: ChatInputCommandInteraction
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
      `現在の話速は${connectionManager.speakSpeed * 100}%です。`,
      undefined,
      false
    )
  }

  async setReadName(
    connectionManager: ConnectionManager | undefined,
    interaction: ChatInputCommandInteraction,
    name: boolean
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

    connectionManager.name = name
    const values = { name }
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
      `名前を読み上げ${connectionManager.name ? 'る' : 'ない'}ようにしました！`,
      undefined,
      false
    )
  }

  async getReadName(
    connectionManager: ConnectionManager | undefined,
    interaction: ChatInputCommandInteraction
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
      `現在、名前を読み上げま${connectionManager.name ? 'す' : 'せん'}。`,
      undefined,
      false
    )
  }

  async getWords(interaction: ChatInputCommandInteraction): Promise<void> {
    const words = this.engine.get_user_dict_words()
    const bot = this.client.user as ClientUser
    const embeds: EmbedBuilder[] = []
    let counter = 0
    let embed = new EmbedBuilder().setTitle('単語一覧')
    for (const [_, word] of Object.entries(words)) {
      if (counter !== 0 && counter % 9 == 0) {
        embeds.push(embed)
        embed = new EmbedBuilder()
      }
      let accentStr = ''
      for (let i = 0; i < word.mora_count!; i++) {
        if (i === word.accent_type - 1) {
          accentStr += '＼'
        } else if (i === 0) {
          accentStr += '／'
        } else if (i > word.accent_type - 1) {
          accentStr += '＿'
        } else {
          accentStr += '￣'
        }
      }
      let priorityStr = '優先度: '
      priorityStr += priorityList.find(
        (value) => value.value === word.priority
      )!.name
      embed.addFields({
        name: word.surface,
        value: `${word.yomi}\n${accentStr}\n${priorityStr}`,
        inline: true,
      })
      counter++
    }
    embeds.push(embed)
    await sendReply(interaction, { embeds })
  }

  async registerWord(
    interaction: ChatInputCommandInteraction,
    surface: string,
    yomi: string,
    priority: number | null
  ): Promise<void> {
    const words = this.engine.get_user_dict_words()
    let foundUuid: string | undefined
    for (const [wordUuid, word] of Object.entries(words)) {
      if (convertHankakuToZenkaku(surface) == word.surface) {
        foundUuid = wordUuid
        break
      }
    }
    // AquesTalkライク記法によるアクセント指定を可能にする
    yomi = yomi.replace('’', "'")
    const accentMatch = yomi.match(/'/g)
    if (accentMatch !== null) {
      if (accentMatch.length !== 1) {
        await this.sendEmbed(
          interaction,
          'アクセントが2つ以上存在します。アクセントは1つだけ指定してください。',
          undefined,
          false
        )
        return
      }
    } else {
      yomi += "'"
    }
    yomi = convertHiraToKana(yomi)
    const pronunciation = yomi.replace("'", '')
    if (!kanaRegex.test(pronunciation)) {
      await this.sendEmbed(
        interaction,
        "読みに使えない文字が含まれています。読みに使えるのはひらがなとカタカナ、アクセント用の「'」(シングルクオーテーション)のみです",
        undefined,
        false
      )
      return
    }

    let accentPhrase: AccentPhrase[]
    try {
      accentPhrase = this.engine.accent_phrases(convertLongVowel(yomi), 0, true)
    } catch (e) {
      console.log(e, yomi)
      await this.sendEmbed(
        interaction,
        '読みの文字列が間違っています。例えば、文字列の先頭にアクセントをつけることは出来ません。',
        undefined,
        false
      )
      return
    }
    const accentType = accentPhrase[0].accent

    try {
      if (foundUuid) {
        this.engine.rewrite_user_dict_word(
          surface,
          pronunciation,
          accentType,
          foundUuid,
          undefined,
          priority === null ? 5 : priority
        )
      } else {
        this.engine.add_user_dict_word(
          surface,
          pronunciation,
          accentType,
          undefined,
          priority === null ? 5 : priority
        )
      }
    } catch (e) {
      await this.sendEmbed(
        interaction,
        'エラーが発生しました...',
        undefined,
        false
      )
      console.log(e)
      return
    }

    await this.sendEmbed(
      interaction,
      `${surface}(${yomi})を${foundUuid ? '更新' : '登録'}しました。`,
      undefined,
      false
    )
    return
  }

  async deleteWord(
    interaction: ChatInputCommandInteraction,
    surface: string
  ): Promise<void> {
    const words = this.engine.get_user_dict_words()
    let foundUuid: string | undefined
    for (const [wordUuid, word] of Object.entries(words)) {
      if (convertHankakuToZenkaku(surface) == word.surface) {
        foundUuid = wordUuid
        break
      }
    }
    if (foundUuid) {
      this.engine.delete_user_dict_word(foundUuid)
    } else {
      await this.sendEmbed(
        interaction,
        '削除したい単語が見つかりませんでした。',
        undefined,
        false
      )
      return
    }

    await this.sendEmbed(
      interaction,
      `${surface}を削除しました。`,
      undefined,
      false
    )
    return
  }
}
