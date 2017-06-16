/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import hg from "./hg";
import irc from "./irc";
import tcc from "./tcc";
import colors from "irc-colors";
import unique from "array-unique";

const MAX_FAILURES_PER_REVISION = 3;
const TASK_INSPECTOR_URL = "https://tools.taskcluster.net/task-inspector/#";

const PLATFORMS = {
  "linux32": "Linux",
  "linux64": "Linux x64",
  "osx-10-6": "OS X 10.6",
  "osx-10-7": "OS X 10.7",
  "osx-10-8": "OS X 10.8",
  "osx-10-9": "OS X 10.9",
  "osx-10-10": "OS X 10.10",
  "osx-10-11": "OS X 10.11",
  "windowsxp": "Windows XP",
  "windows7-32": "Windows 7",
  "windows7-64": "Windows 7 x64",
  "windows8-32": "Windows 8",
  "windows8-64": "Windows 8 x64",
  "windows10-32": "Windows 10",
  "windows10-64": "Windows 10 x64",
  "windows2012-64": "Windows 2012 x64"
};

let failuresPerRevision = new Map();

function parseRevision(routes) {
  let route = routes.find(r => /^tc-treeherder(\.v2)?\.nss\./.test(r));
  if (!route) {
    return null;
  }

  let matches = route.match(/^tc-treeherder(?:\.v2)?\.nss\.([a-f0-9]+)/);
  if (!matches) {
    return null;
  }

  return matches[1];
}

tcc.onRevisionPushed(async function (msg) {
  let {heads} = msg.payload.payload;

  for (let head of heads) {
    let changesets = await hg.fetchChangesets(head, msg.routingKey);

    for (let changeset of changesets) {
      let level = colors.blue("push");
      let branch = changeset.branch == "default" ? "" : colors.gray(` ${changeset.branch}`);
      irc.say(`[${level}${branch}] ${changeset.href} — ${changeset.author.name} — ${changeset.desc}`);
    }
  }
});

tcc.onTaskFailed(async function (msg) {
  let revision = parseRevision(msg.routes);
  if (!revision) {
    return;
  }

  let taskId = msg.payload.status.taskId;
  let task = await tcc.fetchTask(taskId);
  let th = task.extra.treeherder;

  // Let's not annoy people.
  let numFailures = failuresPerRevision.get(revision) || 0;
  failuresPerRevision.set(revision, ++numFailures);
  if (numFailures > MAX_FAILURES_PER_REVISION) {
    return;
  }

  // Ignore tier-3 task failures.
  if (parseInt(th.tier || 1, 10) == 3) {
    return;
  }

  // Determine platform.
  let collection = Object.keys(th.collection || {})[0] || "opt";
  let platform = PLATFORMS[th.build.platform] || th.build.platform;

  // Fetch changesets.
  let changesets = await hg.fetchChangesets(revision, "projects/nss");
  let authors = changesets.map(changeset => changeset.author);
  let url = TASK_INSPECTOR_URL + taskId;
  let level = colors.red("failure");

  let blame = unique(authors.map(author => author.name)).join(", ");
  irc.say(`[${level}] ${url} — ${task.metadata.name} @ ${platform} ${collection} (blame: ${blame})`);
});

// Join ASAP.
irc.connect();
