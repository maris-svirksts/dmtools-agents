/**
 * Check Subtasks Done For BA — postJSAction for story_ba_check agent.
 *
 * Runs on every SM cycle for each Story in "PO Review".
 * - If all subtasks are Done → moves the Story to "BA Analysis".
 * - Otherwise → removes the SM idempotency label so the SM re-triggers
 *   this check on the next cycle.
 */

function action(params) {
    try {
        const ticketKey = params.ticket.key;
        console.log('=== BA readiness check for', ticketKey, '===');

        const customParams = params.jobParams && params.jobParams.customParams;
        const removeLabel = customParams && customParams.removeLabel;

        function releaseLock() {
            if (removeLabel) {
                try {
                    jira_remove_label({ key: ticketKey, label: removeLabel });
                    console.log('Released SM label — will re-check next cycle');
                } catch (e) {
                    console.warn('Failed to remove SM label:', e);
                }
            }
        }

        // Step 1: Total subtasks
        const allSubtasksResult = jira_search_by_jql({
            jql: 'parent = "' + ticketKey + '" AND issuetype = Subtask',
            maxResults: 1
        });

        const totalSubtasks = allSubtasksResult
            ? (allSubtasksResult.total || (allSubtasksResult.issues && allSubtasksResult.issues.length) || 0)
            : 0;

        console.log('Total subtasks:', totalSubtasks);

        if (totalSubtasks === 0) {
            console.log('No subtasks found — releasing lock, will re-check next cycle');
            releaseLock();
            return { success: true, action: 'no_subtasks', ticketKey };
        }

        // Step 2: Subtasks not yet Done
        const notDoneResult = jira_search_by_jql({
            jql: 'parent = "' + ticketKey + '" AND issuetype = Subtask AND status != Done',
            maxResults: 1
        });

        const notDoneCount = notDoneResult
            ? (notDoneResult.total || (notDoneResult.issues && notDoneResult.issues.length) || 0)
            : 0;

        console.log('Subtasks not yet Done:', notDoneCount, '/', totalSubtasks);

        if (notDoneCount > 0) {
            console.log('Not all subtasks done — releasing lock, will re-check next cycle');
            releaseLock();
            return { success: true, action: 'waiting', totalSubtasks, notDoneCount, ticketKey };
        }

        // Step 3: All subtasks Done → move to BA Analysis
        console.log('All', totalSubtasks, 'subtask(s) done — moving', ticketKey, 'to BA Analysis');

        jira_move_to_status({
            key: ticketKey,
            statusName: 'BA Analysis'
        });

        jira_post_comment({
            key: ticketKey,
            comment: 'h3. ✅ PO Review Complete — Moving to BA Analysis\n\n' +
                'All *' + totalSubtasks + '* subtask(s) are *Done*.\n\n' +
                'The story has been automatically moved to *BA Analysis*.'
        });

        console.log('✅ Story', ticketKey, 'moved to BA Analysis');
        return { success: true, action: 'moved_to_ba_analysis', totalSubtasks, ticketKey };

    } catch (error) {
        console.error('❌ Error in checkSubtasksDoneForBA:', error);
        return { success: false, error: error.toString() };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { action };
}
