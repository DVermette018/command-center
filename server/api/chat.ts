import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'

export default defineLazyEventHandler(async () => {
  return defineEventHandler(async (event: H3Event) => {
    // const { messages }: { messages: UIMessage[] } = await readBody(event)

    // Example: you could read/write your DB here, e.g. save the message thread
    // await db.saveConversation(messages)

    const reply = {
      id: randomUUID(),
      role: 'assistant',
      content: 'Hello from the server',
    }

    // Return only the reply (or both the echo + reply — up to your client)
    return reply
  })
})
