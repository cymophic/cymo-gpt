const { OpenAI } = require('openai')

require('dotenv/config')

// LOGS BOT IN USING PERSONAL TOKEN FROM OPENAI
const getSecret = process.env
const openAI = new OpenAI({
    apiKey: getSecret.OPENAI_KEY
})

// GENERATES A RESPONSE BASED ON CONVERSATION
const generateAIResponse = async (conversation) => {
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

// GETS STARTING PROMPT AND OTHER MESSAGES INTO AN ARRAY
const getConversations = async (message, bot) => {

    let conversation = []

    //-- Gets Starting Prompt
    conversation.push({
        role: 'system',
        content: getSecret.STARTING_PROMPT
    })
    
    //-- Gets Past # Messages (# = Limit)
    let messageHistory = await message.channel.messages.fetch({ limit: 10 })
    messageHistory.reverse()

    messageHistory.forEach((chat) => {
        const senderUsername = chat.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')
        if (chat.author.bot && chat.author.id !== bot.user.id) return;
            // if (chat.content.startsWith(PREFIX_IGNORE)) return;

        //-- Filters chat from user
        if (chat.author.id !== bot.user.id) {

            let imageUrls
            if (chat.attachments.size > 0) { //-- Checks if Message has Attachments
                const imageAttachments = chat.attachments.filter(attachment => { //-- Filter attachments to include only images
                    return attachment.contentType && attachment.contentType.startsWith('image/');
                })
                
                //-- Joins URLs together if multiple images are detected.
                imageUrls = imageAttachments.map(attachment => attachment.url).join('\n');

                conversation.push({
                    role: 'user',
                    name: senderUsername,
                    content: [{
                        type: 'text',
                        text: 'describe this image'
                    }, {
                        type: 'image_url',
                        image_url: {
                            url: imageUrls
                        }
                    }]
                }) 
            }
    
            conversation.push({
                role: 'user',
                name: senderUsername,
                content: chat.content
            }) 

            return;
        } 

        //-- Gets chats from bot
        conversation.push({
            role: 'assistant',
            name: senderUsername,
            content: chat.content
        }) 
    })

    return conversation
}

module.exports = { getConversations, generateAIResponse }