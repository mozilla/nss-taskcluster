/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import jerk from "jerk";

const NICK = "nss-tc";
const CHANNEL = "#nss-test";
const SERVER = "irc.mozilla.org";

let waiting, bot, connected;
let queue = [];

function say(msg) {
  queue.push([CHANNEL, msg]);
  processQueue();
};

function processQueue() {
  if (!connected) {
    connect();
    return;
  }

  if (!queue.length || waiting) {
    return;
  }

  bot.say.apply(bot, queue.shift());

  waiting = true;
  setTimeout(() => {
    waiting = false;
    processQueue();
  }, 500);
}

function connect() {
  if (bot) {
    return;
  }

  function onConnect() {
    connected = true;
    processQueue();
  }

  bot = jerk(() => {}).connect({
    server: SERVER,
    onConnect: onConnect,
    channels: [CHANNEL],
    waitForPing: true,
    nick: NICK
  });
}

module.exports.say = say;
module.exports.connect = connect;
