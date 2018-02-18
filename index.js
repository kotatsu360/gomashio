const slack = process.env.slackIncomingWebHook;
const request = require('request');

const config = (function () {
  let config = require('./config/config.json');
  const topLevelKeyList = ['account_map', 'ignore_event_map'];
  for (let i = 0, len = topLevelKeyList.length; i < len; i++) {
    config[topLevelKeyList[i]] = config[topLevelKeyList[i]] || {};
  }
  return config;
})();

const link = function (url, text) {
  return '<' + url + '|' + text + '>';
};

const g2s = function (user) {
  return config.account_map[user] || user;
};

const isIgnore = function (event, action) {
  const index = (config.ignore_event_map[event] || []).indexOf(action);
  return index !== -1;
};

const userList = function (obj) {
  return obj.map(function(x){
    return '@' + g2s(x.login);
  }).join(' ');
};

const replaceUser = function (text) {
  // [NOTE] GitHub Webhook replace space to plus (+) mark.
  // There is no way to distinguish between + in the text and + in the blank.
  return text.replace(/\+/g,' ').replace(/@([a-zA-Z0-9_\-]+)/g, function(match, p1) {
    return '@' + g2s(p1);
  });
};

exports.handler = (event, context, callback) => {

  const githubEvent = event.headers['X-GitHub-Event'];
  const payloadText = decodeURIComponent(event.body.replace(/^payload=/,''));

  console.info(githubEvent);

  // [NOTE] CloudWatch Logs will display cleanly for text format than json format.
  console.info(payloadText);
  
  const payload = JSON.parse(payloadText);
  const action = payload.action || '';

  let text='';

  if (isIgnore(githubEvent, action)) {
    callback(null, responce);
  }

  switch (githubEvent){
    case 'issue_comment':
    case 'pull_request_review_comment':
      const comment = payload.comment;
      text += comment.user.login + ': \n';
      text += replaceUser(comment.body) + '\n';
      text += comment.html_url;
      break;
    case 'issues':
      const issue = payload.issue;
      if (action == 'assigned') {
        text += 'Issue ' + action + '\n';

        text += 'Assignees: ' + userList(issue.assignees) + '\n';
        text += link(issue.html_url, issue.title);
      }
      break;
    case 'pull_request':
      const pull_request = payload.pull_request;
      if (action == 'assigned') {
        text += 'Pull Request ' + action + '\n';
        text += pull_request.title + '\n';

        text += 'Reviewers: ' + userList(pull_request.requested_reviewers) + '\n';
        text += 'Assignees: ' + userList(pull_request.assignees) + '\n';

        text += link(pull_request.html_url, pull_request.title);
      }
      break;
    default:
      break;
  }

  // responce to GitHub
  const responce = {
    statusCode: 200,
    headers: {},
    body: JSON.stringify({ 'message': 'gomashio received' })
  };

  if (text === '') {
    callback(null, responce);
  }

  request({
    url: slack,
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    json: {text: text, link_names: 1}
  }, function () {
    callback(null, responce);
  });
};
