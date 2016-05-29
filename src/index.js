/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import hg from "./hg";
import irc from "./irc";
import tcc from "./tcc";
import colors from "irc-colors";
import unique from "array-unique";

const TASK_INSPECTOR_URL = "https://tools.taskcluster.net/task-inspector/#";

const PLATFORMS = {
  linux32: "Linux",
  linux64: "Linux x64"
};

function containsNssRoute(routes) {
  return routes.some(r => /^tc-treeherder\.nss\./.test(r));
}

tcc.onTaskDefined(async function (msg) {
  // Check for NSS tasks.
  if (!containsNssRoute(msg.routes)) {
    return;
  }

  let taskId = msg.payload.status.taskId;
  let task = await tcc.fetchTask(taskId);
  let th = task.extra.treeherder;

  // Check for decision tasks.
  if (th.symbol != "D") {
    return;
  }

  let options = {includeHref: true};
  let changesets = await hg.fetchChangesets(th.revision, options);

  for (let changeset of changesets) {
    let level = colors.blue("push");
    let desc = changeset.desc.split("\n")[0];
    irc.say(`[${level}] ${changeset.href} - ${changeset.author.name} - ${desc}`);
  }
});

tcc.onTaskFailed(async function (msg) {
  // Check for NSS tasks.
  if (!containsNssRoute(msg.routes)) {
    return;
  }

  let taskId = msg.payload.status.taskId;
  let task = await tcc.fetchTask(taskId);
  let th = task.extra.treeherder;

  // Determine platform.
  let collection = Object.keys(th.collection || {})[0] || "opt";
  let platform = PLATFORMS[th.build.platform] || th.build.platform;

  let level = colors.red("failure");
  let url = TASK_INSPECTOR_URL + taskId;
  let authors = await hg.fetchBlamelist(th.revision);
  let blame = unique(authors.map(author => author.name)).join(", ");
  irc.say(`[${level}] ${url} - ${task.metadata.name} @ ${platform} ${collection} (blame: ${blame})`);
});

// Join ASAP.
irc.connect();
