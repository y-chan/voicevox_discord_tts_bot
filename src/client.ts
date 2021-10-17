import { Client as OriginalClient, ClientOptions, Snowflake } from 'discord.js'

import { createCommandList, CustomApplicationCommandData } from '@/src/command'
import ConnectionManager from '@/src/connectionManager'
import TextToSpeechBot from '@/src/textToSpeechBot'

export default class Client extends OriginalClient {
  public textToSpeechBot: TextToSpeechBot = new TextToSpeechBot(this)
  public connectionManagers = new Map<Snowflake, ConnectionManager>()
  public commandList: CustomApplicationCommandData[] = createCommandList(this)
}
