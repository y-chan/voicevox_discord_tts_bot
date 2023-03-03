import {
  AudioPlayer,
  AudioPlayerStatus,
  AudioResource,
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
} from '@discordjs/voice'
import { ChatInputCommandInteraction, Message } from 'discord.js'
import { Readable } from 'stream'

import TextToSpeechBot from '@/src/textToSpeechBot'
import { sleep } from '@/src/util'

export interface ReadQueueItem {
  content: string
  userName: string
  userId?: string
  readEnd?: true
  containAttachment?: string
}

export default class ConnectionManager {
  public resource: AudioResource | undefined
  public player: AudioPlayer = createAudioPlayer()
  public readyLock: boolean = false
  public readQueue: ReadQueueItem[] = [
    {
      content: 'TTS機能を起動しました。',
      userName: '',
    },
  ]
  private samePerson: boolean = false

  constructor(
    public connection: VoiceConnection,
    public dbFound: boolean,
    public volume: number,
    public speakerId: number,
    public speakSpeed: number,
    public name: boolean,
    public calledInteraction: ChatInputCommandInteraction,
    private textToSpeechBot: TextToSpeechBot
  ) {
    this.player.on('stateChange', async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        if (this.readQueue.length > 0 && this.readQueue[0].readEnd) {
          if (this.readQueue[0].content.length !== 0) await sleep(1000)
          this.connection?.destroy()
          await this.textToSpeechBot.sendEmbed(
            this.calledInteraction,
            'TTS機能を停止しました'
          )
          this.readQueue = []
          this.textToSpeechBot.emit(
            'remove',
            this.connection.joinConfig.guildId
          )
        }
        this.samePerson =
          this.readQueue[0]?.userId !== undefined &&
          this.readQueue[0]?.userId === this.readQueue[1]?.userId
        this.readQueue = this.readQueue.slice(1)
        await this.readText()
      }
    })
    this.connection.on('stateChange', async (oldState, newState) => {
      if (newState.status === VoiceConnectionStatus.Disconnected) {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          try {
            await entersState(
              this.connection,
              VoiceConnectionStatus.Connecting,
              5_000
            )
          } catch {
            try {
              this.connection.destroy()
            } catch {}
          }
        } else if (this.connection.rejoinAttempts < 5) {
          await sleep((this.connection.rejoinAttempts + 1) * 5_000)
          this.connection.rejoin()
        } else {
          try {
            this.connection.destroy()
          } catch {}
        }
      } else if (
        !this.readyLock &&
        (newState.status === VoiceConnectionStatus.Connecting ||
          newState.status === VoiceConnectionStatus.Signalling)
      ) {
        this.readyLock = true
        try {
          await entersState(
            this.connection,
            VoiceConnectionStatus.Ready,
            20_000
          )
        } catch {
          if (this.connection.state.status !== VoiceConnectionStatus.Destroyed)
            this.connection.destroy()
        } finally {
          this.readyLock = false
        }
      }

      const oldNetworking = Reflect.get(oldState, 'networking');
      const newNetworking = Reflect.get(newState, 'networking');

      const networkStateChangeHandler = (_: any, newNetworkState: any) => {
        const newUdp = Reflect.get(newNetworkState, 'udp');
        clearInterval(newUdp?.keepAliveInterval);
      };

      oldNetworking?.off('stateChange', networkStateChangeHandler);
      newNetworking?.on('stateChange', networkStateChangeHandler);
    })
  }

  async playAudio(stream: Readable) {
    this.resource = createAudioResource(stream, {
      inlineVolume: true,
    })
    this.resource.volume?.setVolume(this.volume)
    this.player.play(this.resource)
    try {
      await entersState(this.player, AudioPlayerStatus.Playing, 100_000)
    } catch (e) {
      this.connection.disconnect()
      throw e
    }
    this.connection?.subscribe(this.player)
  }

  async readText(message?: Message): Promise<void> {
    if (message) {
      // ";"または"；"で始まる文章は読み上げ無視
      if (message.cleanContent[0] === ';' || message.cleanContent[0] === '；') {
        return
      }
      let containAttachment: string = ''
      if (message.attachments.size) {
        for (const [_, attachment] of message.attachments) {
          if (attachment.contentType) {
            if (attachment.contentType.startsWith('image/')) {
              if (
                containAttachment.length > 0 &&
                ['動画', '音声'].includes(containAttachment)
              ) {
                containAttachment += 'など'
                break
              }
              containAttachment = '画像'
            } else if (attachment.contentType.startsWith('video/')) {
              if (
                containAttachment.length > 0 &&
                ['画像', '音声'].includes(containAttachment)
              ) {
                containAttachment += 'など'
                break
              }
              containAttachment = '動画'
            } else if (attachment.contentType.startsWith('audio/')) {
              if (
                containAttachment.length > 0 &&
                ['画像', '動画'].includes(containAttachment)
              ) {
                containAttachment += 'など'
                break
              }
              containAttachment = '音声'
            } else {
              containAttachment = 'その他のもの'
              break
            }
          }
        }
      }
      this.readQueue.push({
        content: message.cleanContent,
        userName: message.member!.nickname || message.author.username,
        userId: message.author.id,
        containAttachment,
      })
      if (this.readQueue.length > 1) {
        return
      }
    } else if (
      (!message && !this.readQueue.length) ||
      this.player.state.status !== AudioPlayerStatus.Idle
    ) {
      return
    }
    let wav: Buffer
    try {
      const readItem = this.readQueue[0]
      let userName: string
      if (!this.samePerson) {
        userName = readItem.userName
      } else {
        userName = ''
      }
      let prefix: string
      if (userName && readItem.containAttachment?.length) {
        prefix =
          (this.name ? userName : 'だれか') +
          `が${readItem.containAttachment}を送信しました。`
      } else {
        prefix = this.name ? userName : ''
        prefix = prefix + (prefix ? '。' : '')
      }
      const text =
        prefix +
        readItem.content
          .replace('\n', '。')
          .replace(
            new RegExp('http(s)?://[\\w/:%#\\$&\\?\\(\\)~\\.=\\+\\-]+'),
            '。URL。'
          )
          .replace(/<a?:([^<]*):([^<]*)>/g, '。スタンプ。')
      const audioQuery = this.textToSpeechBot.engine.audio_query(
        text.slice(0, 100) + (text.length > 100 ? '、以下略' : ''),
        this.speakerId
      )
      audioQuery.speedScale = this.speakSpeed
      // 早口になるのが少しだけマシになる
      audioQuery.outputSamplingRate = 48000
      wav = this.textToSpeechBot.engine.synthesis(audioQuery, this.speakerId)
    } catch (e) {
      console.log(e)
      return
    }
    const stream = Readable.from(wav)
    await this.playAudio(stream)
  }
}
