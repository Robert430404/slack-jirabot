'use strict';

const JiraToSlack = require('jira2slack');
const moment = require('moment');

/**
 * Class for handling transformations around the response object.
 */
class ResponseTransformer {
  /**
   * Translates the jira username to the slack username.
   *
   * @param userMap
   * @param username
   *
   * @returns {string}
   */
  static transformJiraUsernameToSlackUsername (userMap, username) {
    let retVal = '';

    if (userMap[username]) {
      retVal = `@${userMap[username]}`;
    }

    return retVal;
  }

  /**
   * Format a ticket description for display.
   *
   * * Truncate to 1000 characters by default
   * * Replace any {quote} with ```
   * * If there is no description, add a default value
   *
   * @param {string} description The raw description
   * @param {number} truncationLength
   *
   * @return {string} the formatted description
   */
  static transformDescription (description, truncationLength = 1000) {
    const desc = description || 'Ticket does not contain a description';
    let truncated = desc.substr(0, truncationLength);

    if (desc.length > truncated.length) {
      truncated = truncated + '...';
    }

    return JiraToSlack.toSlack(truncated);
  }

  /**
   * Add additional fields to the minimal response.
   *
   * @param issue
   * @param response
   */
  static transformMinimalResponse (issue, response) {
    response.text = `\`Status: ${issue.fields.status.name}\` `
      + `\`Priority: ${issue.fields.priority.name}\`: `
      + ''
      + response.text;
  }

  /**
   * Applies the transformations for a full response.
   *
   * @param issue
   * @param response
   * @param userMap
   */
  static transformFullResponse (issue, response, userMap = []) {
    const created = moment(issue.fields.created);
    const updated = moment(issue.fields.updated);

    response.fields.push({
      title: 'Created',
      value: created.calendar(),
      short: true
    });

    response.fields.push({
      title: 'Updated',
      value: updated.calendar(),
      short: true
    });

    response.fields.push({
      title: 'Status',
      value: issue.fields.status.name,
      short: true
    });

    response.fields.push({
      title: 'Priority',
      value: issue.fields.priority.name,
      short: true
    });

    response.fields.push({
      title: 'Reporter',
      value: (ResponseTransformer.transformJiraUsernameToSlackUsername(
        userMap,
        issue.fields.reporter.name) || issue.fields.reporter.displayName
      ),
      short: true
    });

    let assignee = 'Unassigned';

    if (issue.fields.assignee) {
      assignee = (ResponseTransformer.transformJiraUsernameToSlackUsername(userMap,
        issue.fields.assignee.name) || issue.fields.assignee.displayName
      );
    }

    response.fields.push({
      title: 'Assignee',
      value: assignee,
      short: true
    });
  }
}

module.exports = ResponseTransformer;
