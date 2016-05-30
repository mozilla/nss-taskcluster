/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import postmark_ from "postmark";
const postmark = postmark_(process.env.POSTMARK_API_TOKEN);

const FROM = "NSS Taskcluster <nss-tc@timtaubert.de>";

async function send(recipients, subject, body) {
  let addresses = recipients.map(recipient => {
    if (recipient.email) {
      return `"${recipient.name || recipient.email}" <${recipient.email}>`;
    }
  }).filter(x => x);

  if (!addresses.length) {
    return;
  }

  postmark.send({
    From: FROM,
    To: addresses.join(", "),
    Subject: subject,
    TextBody: body
  });
}

module.exports.send = send;
