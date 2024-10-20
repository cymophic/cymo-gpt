require('dotenv/config')
const { Client } = require('discord.js')
const { OpenAI } = require('openai')

const client = new Client({
    intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent']
})

client.on('ready', () => {
    console.log('\nThe bot is online and waiting for your response.')
})

const IGNORE_PREFIX = "!"
const CHANNELS = ['1297443219365298207']

const openAI = new OpenAI({
    apiKey: process.env.OPENAI_KEY
})

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(IGNORE_PREFIX)) return;
    if (!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping()
    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping()
    }, 5000)

    let conversation = []
    conversation.push({
        role: 'system',
        content: 'You are a helpful assistant developed by Cymo that always speaks in lowercase and only uses commas as punctuation, avoid using periods, exclamation marks, or question marks, you avoid long paragraphs when explaining things, you avoid asking for the users next input and you only do what you are told.'
    })

    let prevMessages = await message.channel.messages.fetch({ limit: 10 }) 
    prevMessages.reverse()

    prevMessages.forEach((msg) => {
        if (msg.author.bot && msg.author.id !== client.user.id) return;
        if (msg.content.startsWith(IGNORE_PREFIX)) return;

        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if (msg.author.id === client.user.id) {
            conversation.push({
                role: 'assistant',
                name: username,
                content: msg.content
            }) 
            
            return;
        }

        conversation.push({
            role: 'user',
            name: username,
            content: msg.content
        })
    })

    const response = await openAI.chat.completions
        .create({
            model: 'gpt-4o-mini',
            messages: conversation
        }) .catch((error) => console.error('\nOpenAI Error:\n', error))

    clearInterval(sendTypingInterval)
    if (!response) {
        message.reply("I'm having some trouble at the moment. Let's talk again later.")
    }

    const responseMessage = response.choices[0].message.content
    const chunkSizeLimit = 2000
    for (let i = 0; i < responseMessage.length; i+= chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit)

        await message.reply(chunk)
    }
})

client.login(process.env.TOKEN)
