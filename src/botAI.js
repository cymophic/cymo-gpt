const { OpenAI } = require('openai')
require('dotenv/config')

const config = require('../config/config.json');

// LOGS BOT IN USING PERSONAL TOKEN FROM OPENAI
const getSecret = process.env
const openAI = new OpenAI({
    apiKey: getSecret.OPENAI_KEY
})

// GENERATES A RESPONSE BASED ON CONVERSATION
const generateAIResponse = async (conversation) => {
    try {
        const response = await openAI.chat.completions.create({
            model: config.AImodel,
            messages: conversation,
        })
        return response
    } catch (error) {
        console.error('\nOpenAI Error:\n', error)
        throw new Error("Failed to get response from OpenAI")
    }
}

// LOADS STARTING PROMPT AND OTHER MESSAGES INTO AN ARRAY
const getConversations = async (message, bot) => {
    let conversation = []

    //-- Feeds Necessary Starting Details to AI
    conversation.push({
        role: 'system',
        content: getSecret.STARTING_PROMPT
    }, {
        role: 'system',
        content: `You are talking to ${message.member.user.globalName}, or ${message.author.username}`
    })
    
    //-- Gets Past # Messages (# = Limit)
    let messageHistory = await message.channel.messages.fetch({ limit: config.messageHistoryLimit })
    messageHistory.reverse()

    messageHistory.forEach((chat) => {
        const senderUsername = chat.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '')
        if (chat.author.bot && chat.author.id !== bot.user.id) return;
            // if (chat.content.startsWith(PREFIX_IGNORE)) return;

        //-- Filters chat from user
        if (chat.author.id !== bot.user.id) {

            let imageURL
            if (chat.attachments.size > 0) { //-- Checks if Message has Attachments
                const imageAttachments = chat.attachments.filter(attachment => { //-- Filter attachments to include only images
                    return attachment.contentType && attachment.contentType.startsWith('image/');
                })
                
                if (imageAttachments.size > 0) { //-- Gets the latest image URL only
                    imageURL = imageAttachments.first().url;  
                }

                //-- Filters whether its an image or a message that's fed to AI 
                if (imageURL) { //-- For Image
                    conversation.push({ 
                        role: 'user',
                        name: senderUsername,
                        content: [
                            { type: 'text', text: chat.content || 'describe this image' },
                            { type: 'image_url', image_url: { url: imageURL, detail: 'low' }}
                        ]
                    });
                } else { //-- For Normal Message
                    conversation.push({
                        role: 'user',
                        name: senderUsername,
                        content: chat.content
                    });
                }
    
                return;
            }
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