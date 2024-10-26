// INITIALIZATIONS
require('dotenv/config')
const { Client, GatewayIntentBits, ActivityType, Events, PresenceUpdateStatus } = require('discord.js')

const config = require('../config/config.json');
const { getConversations, generateAIResponse } = require('./botAI')

const bot = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	]
})

// TIMER TO TRACK INACTIVITY
let inactivityTimer = null;
// SETS BOT STATUS
const setBotStatus = (
    status = config.botDefaultStatus.status,
    type = ActivityType[config.botDefaultStatus.activityType],
    activityName = config.botDefaultStatus.activityName
) => {
    try {
        bot.user.setPresence({
            activities: [{ name: activityName, type: type }],
            status: status
        });
    } catch (error) {
        console.error("Failed to set bot status:", error);
    }
};

// ON START
bot.on(Events.ClientReady, () => {
    console.log(`${bot.user.username} is ready and is listening to messages!`)
    setBotStatus(PresenceUpdateStatus.DoNotDisturb, ActivityType.Watching, 'messages');
})

// ON CHATTING
bot.on(Events.MessageCreate, async (message) => {

    //-- Constraints
    if (message.author.bot) return
    if (!config.allowedChannels.includes(message.channelId) && !message.mentions.users.has(bot.user.id)) return

    //-- Reset inactivity timer
    if (inactivityTimer) clearTimeout(inactivityTimer)
    setBotStatus(PresenceUpdateStatus.Online, ActivityType.Listening, 'you')

    //-- Sends Discord Typing Behavior
    await message.channel.sendTyping()
    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping()
    }, config.typingInterval)

        let botResponse
        try { //-- Gets Messages and Response
            const conversation = await getConversations(message, bot);
            botResponse = await generateAIResponse(conversation);
        } catch (error) {
            clearInterval(sendTypingInterval);
            message.reply("I'm having some trouble at the moment. Let's talk again later.");
            console.error("Error: ", error)
            return;
        }

        //-- Cuts Message Every 2000 Characters
        const responseMessage = botResponse.choices[0].message.content
        const chunkSizeLimit = config.responseChunkSize
        for (let i = 0; i < responseMessage.length; i+= chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit)

            await message.reply(chunk)
        }

    clearInterval(sendTypingInterval) 
    
    //-- Starts Inactivity Tracker
    inactivityTimer = setTimeout(() => {
        setBotStatus(PresenceUpdateStatus.DoNotDisturb, ActivityType.Watching, 'messages')
    }, config.inactivityTimeout); // 10000 milliseconds = 10 seconds
})

// ASSIGNS BOT WITH PERSONAL TOKEN FROM DISCORD
const getSecret = process.env
bot.login(getSecret.BOT_TOKEN)