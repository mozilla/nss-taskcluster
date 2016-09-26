/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import taskcluster from "taskcluster-client";

const HG_EXCHANGE = "exchange/hgpushes/v1";

let queueEvents = new taskcluster.QueueEvents();
let queue = new taskcluster.Queue();

function createListener() {
  return new taskcluster.PulseListener({
    credentials: {
      username: process.env.PG_USERNAME,
      password: process.env.PG_PASSWORD
    }
  });
}

function onRevisionPushed(callback) {
  let listener = createListener();

  listener.bind({exchange: HG_EXCHANGE, routingKeyPattern: "projects/nspr"});
  listener.bind({exchange: HG_EXCHANGE, routingKeyPattern: "projects/nss"});

  listener.on("message", callback);

  listener.connect().then(() => {
    return listener.resume();
  });
}

function onTaskFailed(callback) {
  let listener = createListener();

  listener.bind(queueEvents.taskFailed({
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

module.exports.onRevisionPushed = onRevisionPushed;
module.exports.onTaskFailed = onTaskFailed;
module.exports.fetchTask = fetchTask;
