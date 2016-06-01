/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import irc from "irc";

const NICK = "nss-tc";
const CHANNEL = "#nss";
const SERVER = "irc.mozilla.org";

let client;

function say(msg) {
  if (!client) {
    connect();
  }

  client.say(CHANNEL, msg);
};

function connect() {
  if (client) {
    return;
  }

  client = new irc.Client(SERVER, NICK, {
    floodProtection: true,
    channels: [CHANNEL],
    secure: true,
    port: 6697
  });

  // Keep it from crashing.
  client.addListener("error", msg => {
    console.log("irc error: ", msg);
  });
}

module.exports.say = say;
module.exports.connect = connect;
