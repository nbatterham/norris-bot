const NorrisBot = require('../lib/norrisbot');

const token = process.env.BOT_API_KEY;
const dbPath = process.env.BOT_DP_PATH;
const name = process.env.BOT_NAME;

const norrisbot = new NorrisBot({
  token: token,
  dbPath: dbPath,
  name: 'norris-bot',
});

norrisbot.run();
