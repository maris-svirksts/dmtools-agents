/**
 * Pre-CLI Development Setup Action
 * Combined preCliJSAction for development agents:
 * 1. Moves ticket to In Development status
 * 2. Checks out the feature branch (creating if needed) — ai/<TICKET-KEY>
 * 3. Fetches existing question subtasks with answers into the input folder
 *
 * Used by: story_development.json, test_case_automation.json
 */

const { GIT_CONFIG, STATUSES } = require('./config.js');
const fetchQuestionsToInput = require('./fetchQuestionsToInput.js');

function checkoutBranch(ticketKey) {
    var branchName = 'ai/' + ticketKey;
    console.log('Setting up branch:', branchName);

    try {
        cli_execute_command({ command: 'git config user.name "' + GIT_CONFIG.AUTHOR_NAME + '"' });
        cli_execute_command({ command: 'git config user.email "' + GIT_CONFIG.AUTHOR_EMAIL + '"' });
    } catch (e) {
        console.warn('Failed to configure git author:', e);
    }

    try {
        cli_execute_command({ command: 'git fetch origin --prune' });
    } catch (e) {
        console.warn('Could not fetch remote branches:', e);
    }

    var localBranches = '';
    try {
        localBranches = cli_execute_command({ command: 'git branch --list "' + branchName + '"' }) || '';
    } catch (e) {
        console.warn('Error checking local branches:', e);
    }

    if (localBranches.trim()) {
        console.log('Branch exists locally, checking out:', branchName);
        cli_execute_command({ command: 'git checkout ' + branchName });
    } else {
        var remoteBranches = '';
        try {
            remoteBranches = cli_execute_command({ command: 'git ls-remote --heads origin ' + branchName }) || '';
        } catch (e) {
            console.warn('Error checking remote branches:', e);
        }

        if (remoteBranches.trim()) {
            console.log('Branch exists on remote, checking out with tracking:', branchName);
            cli_execute_command({ command: 'git checkout -b ' + branchName + ' origin/' + branchName });
        } else {
            console.log('Creating new branch from', GIT_CONFIG.DEFAULT_BASE_BRANCH + ':', branchName);
            cli_execute_command({ command: 'git checkout ' + GIT_CONFIG.DEFAULT_BASE_BRANCH });
            cli_execute_command({ command: 'git pull origin ' + GIT_CONFIG.DEFAULT_BASE_BRANCH });
            cli_execute_command({ command: 'git checkout -b ' + branchName });
        }
    }

    console.log('Branch ready:', branchName);
}

function action(params) {
    try {
        var folder = params.inputFolderPath;
        var ticketKey = folder.split('/').pop();

        // 1. Move ticket to In Development
        try {
            jira_move_to_status({ key: ticketKey, statusName: STATUSES.IN_DEVELOPMENT });
            console.log('Moved ' + ticketKey + ' to In Development');
        } catch (e) {
            console.warn('Failed to move ticket to In Development:', e);
        }

        // 2. Checkout or create feature branch
        try {
            checkoutBranch(ticketKey);
        } catch (e) {
            console.error('Branch checkout failed (non-fatal):', e);
        }

        // 3. Fetch questions with answers into input folder
        fetchQuestionsToInput.action(params);

    } catch (error) {
        console.error('Error in preCliDevelopmentSetup:', error);
    }
}
