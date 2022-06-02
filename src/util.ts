import {
  CommandInteraction,
  Message,
  WebhookEditMessageOptions,
  MessagePayload,
} from 'discord.js'

export async function sendReply(
  interaction: CommandInteraction,
  options: string | MessagePayload | WebhookEditMessageOptions
): Promise<Message> {
  let result: Message
  if (interaction.replied && interaction.channel) {
    result = await interaction.channel.send(options)
  } else {
    result = (await interaction.editReply(options)) as Message
  }
  return result
}

export function sleep(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, time)
  })
}
