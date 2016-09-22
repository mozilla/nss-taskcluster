/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import taskcluster from "taskcluster-client";

let queueEvents = new taskcluster.QueueEvents();
let queue = new taskcluster.Queue();

function onTaskDefined(callback) {
  onTaskEvent("taskDefined", callback);
}

function onTaskFailed(callback) {
  onTaskEvent("taskFailed", callback);
}

function onTaskEvent(type, callback) {
  let listener = new taskcluster.PulseListener({
    credentials: {
      username: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD
    }
  });

  listener.bind(queueEvents[type]({
    provisionerId: "aws-provisioner-v1",
    workerType: "hg-worker"
  }));

  listener.on("message", callback);

  listener.connect().then(() => {
    return listener.resume();
  });
}

async function fetchTask(taskId) {
  return queue.task(taskId);
}

module.exports.onTaskDefined = onTaskDefined;
module.exports.onTaskFailed = onTaskFailed;
module.exports.fetchTask = fetchTask;
