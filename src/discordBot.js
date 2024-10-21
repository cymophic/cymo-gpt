// INITIALIZATIONS
const { buildAI, generateResponse } = require('./botAI')
const { Client, GatewayIntentBits, ActivityType, Events, PresenceUpdateStatus } = require('discord.js')
require('dotenv/config')

// BOT SETTINGS
const allowedChannels = ['1297443219365298207']
const defaultPrefix = "."
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
const setBotStatus = (status, type, activityName) => {
    bot.user.setPresence({
        activities: [{ name: activityName, type: type }],
        status: status
    });
}

// ON START
bot.on(Events.ClientReady, () => {
    console.log(`${bot.user.username} is ready and is listening to messages!`)
    setBotStatus(PresenceUpdateStatus.DoNotDisturb, ActivityType.Watching, 'messages');
})

// ON CHATTING
bot.on(Events.MessageCreate, async (message) => {

    //-- Message Variables
    const messageText = message.content

    //-- Constraints
    if (message.author.bot) return
    if (!allowedChannels.includes(message.channelId) && !message.mentions.users.has(bot.user.id)) return
        // if (message.content.startsWith(ignorePrefix)) return;

    //-- Reset inactivity timer
    if (inactivityTimer) clearTimeout(inactivityTimer);
    setBotStatus(PresenceUpdateStatus.Online, ActivityType.Listening, 'you');

    //-- Sends Discord Typing Behavior
    await message.channel.sendTyping()
    const sendTypingInterval = setInterval(() => {
        message.channel.sendTyping()
    }, 5000)

        //-- Reply
        let botResponse;
        try {
            const conversation = await buildAI(message, bot);
            botResponse = await generateResponse(conversation);
        } catch (error) {
            clearInterval(sendTypingInterval);
            message.reply("I'm having some trouble at the moment. Let's talk again later.");
            return;
        }

        //-- Cuts Message Every 2000 Characters
        const responseMessage = botResponse.choices[0].message.content;
        const chunkSizeLimit = 2000
        for (let i = 0; i < responseMessage.length; i+= chunkSizeLimit) {
            const chunk = responseMessage.substring(i, i + chunkSizeLimit)

            await message.reply(chunk)
        }

    clearInterval(sendTypingInterval) 
    
    // START INACTIVITY TRACKER
    inactivityTimer = setTimeout(() => {
    setBotStatus(PresenceUpdateStatus.DoNotDisturb, ActivityType.Watching, 'messages'); 
    }, 10000); // 10000 milliseconds = 10 seconds
})

const getKey = process.env
bot.login(getKey.BOT_TOKEN);