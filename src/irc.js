/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import irc from "irc";
import request from "request-json";

const NICK = "nss-tc";
const CHANNEL = "#nss";
const SERVER = "irc.mozilla.org";
const BZ_HOST = "https://bugzilla.mozilla.org";

let client;

async function jsonRequest(url) {
  let client = request.createClient(BZ_HOST);

  return new Promise((resolve, reject) => {
    client.get(url, (err, res, json) => {
      if (err) {
        reject(err);
      } else {
        resolve(json);
      }
    });
  });
}

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

  // Listen for bug numbers.
  client.addListener(`message${CHANNEL}`, async function (from, message) {
    let match = /[Bb]ug (\d{5,})/.exec(message);
    if (!match) {
      return;
    }

    let id = match[1];
    let client = request.createClient(BZ_HOST);
    let response = await jsonRequest(`/rest/bug/${id}`);

    if (response.code == 102) {
      say(`https://bugzil.la/${id} — (not authorized to access bug)`);
    } else if (response.bugs) {
      let [bug] = response.bugs;
      let status = bug.resolution || bug.status;

      say(`https://bugzil.la/${id} — ${status}, ${bug.assigned_to} — ${bug.summary}`);
    }
  });
}

module.exports.say = say;
module.exports.connect = connect;
