import {
  CommandInteraction,
  Message,
  MessagePayload,
  WebhookEditMessageOptions,
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

export const kanaRegex = /^[\u3041-\u3094\u30A1-\u30F4\u30FC]+$/
export const convertHiraToKana = (text: string): string => {
  return text.replace(/[\u3041-\u3094]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) + 0x60)
  })
}
export const convertHankakuToZenkaku = (text: string): string => {
  // "!"から"~"までの範囲の文字(数字やアルファベット)を全角に置き換える
  return text.replace(/[\u0021-\u007e]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) + 0xfee0)
  })
}
export const convertLongVowel = (text: string): string => {
  // アクセント記号があっても正しく変換できるように改変済み
  return text
    .replace(/(?<=[アカサタナハマヤラワャァガザダバパ][']?ー*)ー/g, 'ア')
    .replace(/(?<=[イキシチニヒミリィギジヂビピ][']?ー*)ー/g, 'イ')
    .replace(/(?<=[ウクスツヌフムユルュゥヴグズヅブプ][']?ー*)ー/g, 'ウ')
    .replace(/(?<=[エケセテネヘメレェゲゼデベペ][']?ー*)ー/g, 'エ')
    .replace(/(?<=[オコソトノホモヨロヲョォゴゾドボポ][']?ー*)ー/g, 'オ')
    .replace(/(?<=[ン][']?ー*)ー/g, 'ン')
    .replace(/(?<=[ッ][']?ー*)ー/g, 'ッ')
}