/**
 * Post Bug Creation Action (postJSAction for bug_creation agent)
 *
 * Reads outputs/bug_decision.json written by the AI:
 *   { "action": "link", "existingKey": "MYTUBE-XXX" }
 *   { "action": "create", "summary": "...", "description": "outputs/bug_description.md" }
 *
 * Then either links the existing bug or creates a new one and links it.
 * Link direction: Bug "blocks" TC (TC is blocked by the Bug until it's fixed).
 */

const { LABELS } = require('./config.js');

function readFile(path) {
    try {
        var content = file_read({ path: path });
        return (content && content.trim()) ? content : null;
    } catch (e) {
        return null;
    }
}

function readDecisionJson() {
    try {
        var raw = readFile('outputs/bug_decision.json');
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (e) {
        console.error('Failed to parse bug_decision.json:', e);
        return null;
    }
}

function extractKeyFromResult(result) {
    if (!result) return null;
    if (typeof result === 'string') {
        var urlMatch = result.match(/\/browse\/([A-Z]+-\d+)/);
        return urlMatch ? urlMatch[1] : null;
    }
    return result.key || null;
}

function linkBugToTC(ticketKey, bugKey) {
    // Bug "blocks" TC: sourceKey=TC, anotherKey=Bug, relationship='Blocks'
    // → Bug is the blocker, TC is blocked (TC cannot pass until bug is fixed)
    jira_link_issues({
        sourceKey: ticketKey,
        anotherKey: bugKey,
        relationship: 'Blocks'
    });
    console.log('✅ Linked:', bugKey, 'blocks', ticketKey);
}

function action(params) {
    try {
        var ticketKey = params.ticket.key;
        console.log('=== Processing bug creation decision for', ticketKey, '===');

        var decision = readDecisionJson();
        if (!decision) {
            jira_post_comment({
                key: ticketKey,
                comment: 'h3. ⚠️ Bug Creation Error\n\nCould not read bug_decision.json. Check workflow logs.'
            });
            return { success: false, error: 'No bug_decision.json' };
        }

        console.log('Decision:', decision.action, decision.existingKey || decision.summary);

        var bugKey = null;
        var comment = '';

        if (decision.action === 'link' && decision.existingKey) {
            // Link to existing bug
            bugKey = decision.existingKey;
            try {
                linkBugToTC(ticketKey, bugKey);
                comment = 'h3. 🔗 Existing Bug Linked\n\n' +
                    'Found matching bug: *[' + bugKey + '|' + bugKey + ']*\n\n' +
                    (decision.reason ? '_' + decision.reason + '_' : '');
            } catch (e) {
                console.warn('Failed to link existing bug:', e);
                comment = 'h3. ⚠️ Bug Link Failed\n\n' +
                    'Found matching bug *' + bugKey + '* but could not create link: ' + e;
            }

        } else if (decision.action === 'create') {
            // Create new bug
            var summary = decision.summary;
            var descriptionPath = decision.description;
            var description = (descriptionPath ? readFile(descriptionPath) : null)
                || decision.descriptionText
                || summary;

            if (!summary) {
                jira_post_comment({ key: ticketKey, comment: 'h3. ⚠️ Bug Creation Skipped\n\nNo summary provided in bug_decision.json.' });
                return { success: false, error: 'No bug summary' };
            }

            try {
                var projectKey = ticketKey.split('-')[0];
                var result = jira_create_ticket_basic(projectKey, 'Bug', summary, description);
                bugKey = extractKeyFromResult(result);

                if (bugKey) {
                    linkBugToTC(ticketKey, bugKey);
                    comment = 'h3. 🐛 New Bug Created\n\n' +
                        'Created: *[' + bugKey + '|' + bugKey + ']*\n' +
                        '*Summary*: ' + summary + '\n\n' +
                        (decision.reason ? '_' + decision.reason + '_' : '');
                } else {
                    comment = 'h3. ⚠️ Bug Created (key not extracted)\n\nBug was created but key could not be parsed from result.';
                }
            } catch (e) {
                console.error('Failed to create bug:', e);
                comment = 'h3. ❌ Bug Creation Failed\n\n{code}' + e.toString() + '{code}';
            }

        } else {
            comment = 'h3. ✅ No Bug Needed\n\n' + (decision.reason || 'AI determined no bug creation or linking is required.');
        }

        // Post Jira comment
        try {
            jira_post_comment({ key: ticketKey, comment: comment });
        } catch (e) {
            console.warn('Failed to post Jira comment:', e);
        }

        // Remove WIP label
        var wipLabel = params.metadata && params.metadata.contextId
            ? params.metadata.contextId + '_wip'
            : 'bug_creation_wip';
        try { jira_remove_label({ key: ticketKey, label: wipLabel }); } catch (e) {}

        // Remove SM trigger label so rule can re-fire if TC fails again later
        var customParams = params.jobParams && params.jobParams.customParams;
        var removeLabel = customParams && customParams.removeLabel;
        if (removeLabel) {
            try { jira_remove_label({ key: ticketKey, label: removeLabel }); } catch (e) {}
        }

        console.log('✅ Bug creation workflow complete for', ticketKey, '— bugKey:', bugKey || 'none');
        return { success: true, ticketKey: ticketKey, bugKey: bugKey, action: decision.action };

    } catch (error) {
        console.error('❌ Error in postBugCreation:', error);
        try {
            jira_post_comment({
                key: params.ticket.key,
                comment: 'h3. ❌ Bug Creation Error\n\n{code}' + error.toString() + '{code}'
            });
        } catch (e) {}
        return { success: false, error: error.toString() };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { action };
}
