/**
 * SM Agent — Scrum Master automation (JSRunner)
 *
 * Generic script that finds Jira tickets by JQL, optionally transitions their
 * status, and triggers an ai-teammate GitHub Actions workflow for each one.
 *
 * Configured entirely through the JSON config file — no code changes needed
 * when adding new SM automation scenarios.
 *
 * Required config params:
 *   params.inputJql       — JQL to find tickets
 *   params.configFile     — agents/*.json to pass as config_file workflow input
 *
 * Optional config params:
 *   params.targetStatus   — Jira status to transition each ticket to before triggering
 *   params.workflowFile   — GitHub Actions workflow file (default: ai-teammate.yml)
 *   params.workflowRef    — git ref to dispatch on (default: main)
 *   params.skipIfLabel    — skip ticket if it already has this label (idempotency guard)
 *   params.addLabel       — add this label after triggering (idempotency marker)
 */

const { STATUSES } = require('./config.js');
const gh = require('./common/githubHelpers.js');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build URL-encoded agent config for the encoded_config workflow input.
 * Passes minimal params: just the inputJql pointing at this specific ticket.
 */
function buildEncodedConfig(ticketKey) {
    const config = JSON.stringify({
        params: {
            inputJql: 'key = ' + ticketKey
        }
    });
    return encodeURIComponent(config);
}

/**
 * Trigger ai-teammate workflow_dispatch for a single ticket.
 */
function triggerWorkflow(repoInfo, ticketKey, configFile, workflowFile, workflowRef) {
    const encodedConfig = buildEncodedConfig(ticketKey);
    try {
        github_trigger_workflow(
            repoInfo.owner,
            repoInfo.repo,
            workflowFile,
            JSON.stringify({
                concurrency_key: ticketKey,
                config_file:     configFile,
                encoded_config:  encodedConfig
            })
        );
        console.log('✅ Triggered ' + workflowFile + ' for ' + ticketKey);
        return true;
    } catch (e) {
        console.warn('⚠️  Failed to trigger workflow for ' + ticketKey + ': ' + (e.message || e));
        return false;
    }
}

/**
 * Move ticket to the given Jira status (soft-fail — logs warning on error).
 */
function moveStatus(ticketKey, targetStatus) {
    try {
        jira_move_to_status({ key: ticketKey, statusName: targetStatus });
        console.log('✅ Moved ' + ticketKey + ' → ' + targetStatus);
    } catch (e) {
        console.warn('⚠️  Could not move ' + ticketKey + ': ' + (e.message || e));
    }
}

/**
 * Check if the ticket already has a given label.
 */
function hasLabel(ticket, label) {
    if (!label) return false;
    var labels = (ticket.fields && ticket.fields.labels) ? ticket.fields.labels : [];
    return labels.indexOf(label) !== -1;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function action(params) {
    var inputJql     = params.inputJql;
    var targetStatus = params.targetStatus;
    var configFile   = params.configFile;
    var workflowFile = params.workflowFile  || 'ai-teammate.yml';
    var workflowRef  = params.workflowRef   || 'main';
    var skipIfLabel  = params.skipIfLabel;
    var addLabel     = params.addLabel;

    if (!inputJql) {
        console.error('❌ inputJql is required');
        return { success: false, error: 'inputJql is required' };
    }
    if (!configFile) {
        console.error('❌ configFile is required');
        return { success: false, error: 'configFile is required' };
    }

    var repoInfo = gh.getGitHubRepoInfo();
    if (!repoInfo) {
        console.error('❌ Could not detect GitHub repo info from remote URL');
        return { success: false, error: 'No GitHub repo info' };
    }

    console.log('SM Agent — repo:',  repoInfo.owner + '/' + repoInfo.repo);
    console.log('SM Agent — JQL:',   inputJql);
    console.log('SM Agent — workflow:', workflowFile + ' @ ' + workflowRef);

    // ── Query tickets ────────────────────────────────────────────────────────
    var tickets = [];
    try {
        tickets = jira_search_by_jql({ jql: inputJql, limit: 50 }) || [];
    } catch (e) {
        console.error('❌ Jira query failed:', e.message || e);
        return { success: false, error: String(e) };
    }

    if (tickets.length === 0) {
        console.log('No tickets found — nothing to do.');
        return { success: true, processed: 0, skipped: 0 };
    }

    console.log('Found ' + tickets.length + ' ticket(s)');

    // ── Process each ticket ──────────────────────────────────────────────────
    var processed = 0;
    var skipped   = 0;

    tickets.forEach(function(ticket) {
        var key = ticket.key;
        console.log('\n--- ' + key + ' ---');

        // Idempotency: skip if already tagged
        if (skipIfLabel && hasLabel(ticket, skipIfLabel)) {
            console.log('⏭️  Skipping ' + key + ' (already has label: ' + skipIfLabel + ')');
            skipped++;
            return;
        }

        // Transition status
        if (targetStatus) {
            moveStatus(key, targetStatus);
        }

        // Trigger workflow
        var triggered = triggerWorkflow(repoInfo, key, configFile, workflowFile, workflowRef);

        // Mark as processed
        if (triggered && addLabel) {
            try {
                jira_add_label({ key: key, label: addLabel });
            } catch (e) { /* non-critical */ }
        }

        if (triggered) processed++;
    });

    console.log('\nSM Agent done — processed: ' + processed + ', skipped: ' + skipped);
    return { success: true, processed: processed, skipped: skipped };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { action: action };
}
