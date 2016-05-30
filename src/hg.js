/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import request from "request-json";
import parse from "peoplestring-parse";

const HG_HOST = "https://hg.mozilla.org/";
const HG_REPO = "projects/nss";

async function jsonRequest(url) {
  let client = request.createClient(HG_HOST);

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

async function shortenRevision(revision) {
  async function tryShortenedRevisionHash(length) {
    let shortened = revision.slice(0, length);
    let json = jsonRequest(HG_REPO + "/json-pushes?changeset=" + shortened);

    if (typeof(json) == "object") {
      return shortened;
    }

    return tryShortenedRevisionHash(length + 2);
  }

  return tryShortenedRevisionHash(12);
};

async function fetchChangesets(revision) {
  let json = await jsonRequest(HG_REPO + "/json-pushes?full&changeset=" + revision);

  let id = Object.keys(json)[0];
  let changesets = json[id].changesets;

  for (let changeset of changesets) {
    changeset.author = parse(changeset.author);
    changeset.desc = changeset.desc.split("\n")[0];

    let short_rev = await shortenRevision(revision);
    changeset.href = HG_HOST + HG_REPO + "/rev/" + short_rev;
  }

  return changesets;
}

module.exports.fetchChangesets = fetchChangesets;
