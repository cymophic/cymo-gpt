const { OpenAI } = require('openai')

require('dotenv/config')
const getSecret = process.env
const openAI = new OpenAI({
    apiKey: getSecret.OPENAI_KEY
})


const buildAI = async (message, bot) => {
    let conversation = []

    conversation.push({
        role: 'system',
        content: getSecret.AI_PROMPT
    })

    
    let messageHistory = await message.channel.messages.fetch({ limit: 10 })
    messageHistory.reverse()

    messageHistory.forEach((chat) => {
        const senderUsername = chat.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')
        if (chat.author.bot && chat.author.id !== bot.user.id) return;
            // if (chat.content.startsWith(PREFIX_IGNORE)) return;

        if (chat.author.id !== bot.user.id) {
            conversation.push({
                role: 'user',
                name: senderUsername,
                content: chat.content
            }) 
            return;
        }

        conversation.push({
            role: 'assistant',
            name: senderUsername,
            content: chat.content
        }) 
    })

    return conversation
}

const generateResponse = async (conversation) => {
    try {
        const response = await openAI.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: conversation,
        })
        return response
    } catch (error) {
        console.error('\nOpenAI Error:\n', error)
        throw new Error("Failed to get response from OpenAI")
    }
}

module.exports = { buildAI, generateResponse }