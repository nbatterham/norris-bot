const util = require('util');
const path = require('path');
const fs = require('fs');
const SQLite = require('sqlite3').verbose();
const Bot = require('slackbots');

class NorrisBot extends Bot {

  constructor(settings) {
    super(settings);
    this.settings = settings;
    this.settings.name = this.settings.name || 'norris-bot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');

    this.user = null;
    this.db = null;
  }
}

NorrisBot.prototype.run = function () {
  this.on('start', this._onStart);
  this.on('message', this._onMessage);
};

NorrisBot.prototype._onStart = function () {
  this._loadBotUser();
  this._connectBb();
  this._firstRunCheck();
};

NorrisBot.prototype._loadBotUser = function () {
  const self = this;
  this.user = this.users.filter(function (user) {
    return user.name === self.name;
  })[0];
};

NorrisBot.prototype._connectBb = function () {
  if (!fs.existsSync(this.dbPath)) {
    console.error(`Database path "${this.dbPath}" does not exist or it\'s not readable.`);
    process.exit(1);
  }

  this.db = new SQLite.Database(this.dbPath);
}

NorrisBot.prototype._firstRunCheck = function () {
  const self = this;
  self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
    if (err) {
      return console.err('Database Error', err);
    }

    const currentTime = (new Date()).toJSON();

    if (!record) {
      self._welcomeMessage();
      return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
    }

    self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
  });
};

NorrisBot.prototype._welcomeMessage = function () {
  this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
    '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
    {as_user: true});
};

NorrisBot.prototype._onMessage = function (message) {
  if (this._isChatMessage(message) &&
      this._isChannelConversation(message) &&
      !this._isFromNorrisBot(message) &&
      this._isMentioningChuckNorris(message)
  ) {
      this._replyWithRandomJoke(message);
  }
};

NorrisBot.prototype._isChatMessage = function (message) {
  return message.type === 'message' && Boolean(message.text);
};

NorrisBot.prototype._isChannelConversation = function (message) {
  return typeof message.channel === 'string' && message.channel[0] === 'C';
};

NorrisBot.prototype._isFromNorrisBot = function (message) {
  return message.user === this.user.id;
};

NorrisBot.prototype._isMentioningChuckNorris = function (message) {
  return message.text.toLowerCase().indexOf('chuck norris') > -1 || message.text.toLowerCase().indexOf(this.name) > -1;
};

NorrisBot.prototype._replyWithRandomJoke = function (originalMessage) {
  const self = this;
  self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
    if (err) {
      return console.error('DATABASE ERROR:', err);
    }

    const channel = self._getChannelById(originalMessage.channel);
    self.postMessageToChannel(channel.name, record.joke, {as_user: true});
    self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
  });

};

NorrisBot.prototype._getChannelById = function (channelId) {
  return this.channels.filter(function (item) {
    return item.id === channelId;
  })[0];
};

module.exports = NorrisBot;
