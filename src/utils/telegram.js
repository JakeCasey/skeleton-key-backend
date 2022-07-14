require('dotenv').config({ path: '../.env' });
const { Telegraf } = require('telegraf');

let myTelegramId = '517861570';

const bot = new Telegraf(process.env.BOT_TOKEN);

// bot.start(ctx => ctx.reply('Welcome'));
// bot.help(ctx => ctx.reply('Send me a sticker'));
// bot.on('sticker', ctx => ctx.reply('👍'));
// bot.hears('hi', ctx => ctx.reply('Hey there'));
// bot.hears('id', ctx => ctx.reply(ctx.chat.id));
// bot.launch();
// bot.on('text', ctx => ctx.replyWithHTML('<b>Hello</b>'));

let sendMessageToTelegram = (msg) => {
  bot.telegram.sendMessage(myTelegramId, msg);
};

exports.sendMessageToTelegram = sendMessageToTelegram;
