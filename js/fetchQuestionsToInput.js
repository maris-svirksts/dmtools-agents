/**
 * Fetch Questions To Input Pre-CLI Action
 * Fetches existing question subtasks for the current story ticket and writes
 * them to the input folder before the CLI agent runs.
 *
 * Uses params.ticket.fields.subtasks to get subtask keys (JQL parent= filter
 * is unreliable in this Jira instance) and then fetches each subtask
 * individually for full fields (description, Answer, etc.).
 */

function action(params) {
    try {
        var folder = params.inputFolderPath;
        var ticketKey = folder.split('/').pop();
        console.log('Fetching question subtasks for ' + ticketKey + '...');

        // Get subtask keys from the already-loaded ticket fields
        var subtaskRefs = (params.ticket && params.ticket.fields && params.ticket.fields.subtasks) || [];
        console.log('Subtask refs from ticket:', subtaskRefs.length);

        // Fallback: if ticket context not available, try JQL
        if (subtaskRefs.length === 0) {
            try {
                var raw = jira_search_by_jql({
                    jql: 'parent = ' + ticketKey + ' AND issuetype = Subtask ORDER BY created ASC',
                    fields: ['key', 'summary', 'description', 'status', 'priority', 'Answer']
                });
                subtaskRefs = raw || [];
                console.log('Fallback JQL returned:', subtaskRefs.length);
            } catch (e) {
                console.warn('JQL fallback also failed:', e);
            }
        }

        if (subtaskRefs.length === 0) {
            console.log('No subtasks found — writing empty existing_questions.json');
            file_write(folder + '/existing_questions.json', '{"questions":[]}');
            return;
        }

        // Fetch each subtask individually for full fields
        var questions = [];
        for (var i = 0; i < subtaskRefs.length; i++) {
            var ref = subtaskRefs[i];
            var key = ref.key || (ref.fields && ref.key);
            if (!key) continue;
            try {
                var issue = jira_get_ticket({ key: key, fields: ['summary', 'description', 'status', 'priority', 'Answer'] });
                var f = issue.fields || {};
                questions.push({
                    key: key,
                    summary: f.summary || '',
                    description: f.description || '',
                    status: f.status ? f.status.name : '',
                    priority: f.priority ? f.priority.name : '',
                    answer: f.Answer || f.answer || null
                });
            } catch (e) {
                console.warn('Could not fetch subtask ' + key + ':', e);
            }
        }

        console.log('Fetched ' + questions.length + ' question subtasks');
        file_write(folder + '/existing_questions.json', '{"questions":' + JSON.stringify(questions, null, 2) + '}');
        console.log('Wrote existing_questions.json to ' + folder);

    } catch (error) {
        console.error('Error in fetchQuestionsToInput:', error);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { action };
}
