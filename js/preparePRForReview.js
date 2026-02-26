/**
 * Prepare PR for Review Action
 * PreCliJSAction that:
 * 1. Finds PR associated with the ticket
 * 2. Fetches PR metadata, diff, and file list
 * 3. Prepares input folder with all necessary context for AI review
 * 4. Checks out the PR branch for code inspection
 */

const { GIT_CONFIG, STATUSES } = require('./config.js');

/**
 * Clean command output from script wrapper artifacts
 * @param {string} output - Raw command output
 * @returns {string} Cleaned output
 */
function cleanCommandOutput(output) {
    if (!output) {
        return '';
    }
    const lines = output.split('\n').filter(function(line) {
        return line.indexOf('Script started') === -1 &&
               line.indexOf('Script done') === -1 &&
               line.indexOf('COMMAND=') === -1 &&
               line.indexOf('COMMAND_EXIT_CODE=') === -1;
    });
    return lines.join('\n').trim();
}

/**
 * Find PR associated with ticket using GitHub CLI
 * Searches for PRs that mention the ticket key in title or branch
 *
 * @param {string} ticketKey - Jira ticket key
 * @returns {Object|null} PR object with url, number, title, etc.
 */
function findPRForTicket(ticketKey) {
    try {
        console.log('Searching for PR related to', ticketKey);

        // Search for PRs mentioning ticket key in title
        const searchResult = cli_execute_command({
            command: 'gh pr list --search "' + ticketKey + '" --json number,title,url,headRefName,state,author --limit 10'
        }) || '[]';

        const prs = JSON.parse(searchResult);

        if (!prs || prs.length === 0) {
            console.log('No PRs found mentioning', ticketKey);
            return null;
        }

        // Filter for open PRs first
        const openPRs = prs.filter(function(pr) {
            return pr.state === 'OPEN';
        });

        // Prioritize PRs with ticket key in title or branch
        const candidates = (openPRs.length > 0 ? openPRs : prs).filter(function(pr) {
            const inTitle = pr.title && pr.title.indexOf(ticketKey) !== -1;
            const inBranch = pr.headRefName && pr.headRefName.indexOf(ticketKey) !== -1;
            return inTitle || inBranch;
        });

        if (candidates.length === 0) {
            console.warn('Found PRs but none match ticket key in title or branch');
            return prs[0]; // fallback to first PR
        }

        // Return most recent matching PR
        const pr = candidates[0];
        console.log('Found PR #' + pr.number + ':', pr.title);
        console.log('PR URL:', pr.url);

        return pr;

    } catch (error) {
        console.error('Failed to find PR for ticket:', error);
        return null;
    }
}

/**
 * Fetch detailed PR information using GitHub CLI
 *
 * @param {number} prNumber - PR number
 * @returns {Object|null} Detailed PR object
 */
function getPRDetails(prNumber) {
    try {
        const prJson = cli_execute_command({
            command: 'gh pr view ' + prNumber + ' --json number,title,body,url,headRefName,baseRefName,author,createdAt,updatedAt,state,additions,deletions,changedFiles'
        }) || '{}';

        return JSON.parse(prJson);

    } catch (error) {
        console.error('Failed to get PR details:', error);
        return null;
    }
}

/**
 * Fetch PR diff
 *
 * @param {number} prNumber - PR number
 * @returns {string} Full diff text
 */
function getPRDiff(prNumber) {
    try {
        const diff = cli_execute_command({
            command: 'gh pr diff ' + prNumber
        }) || '';

        console.log('Fetched PR diff (' + diff.length + ' characters)');
        return diff;

    } catch (error) {
        console.error('Failed to get PR diff:', error);
        return '';
    }
}

/**
 * Fetch list of files changed in PR
 *
 * @param {number} prNumber - PR number
 * @returns {string} List of changed files
 */
function getPRFiles(prNumber) {
    try {
        const files = cli_execute_command({
            command: 'gh pr view ' + prNumber + ' --json files --jq \'.files[] | "\\(.path) (\\(.additions)+/\\(.deletions)-)"|\''
        }) || '';

        console.log('Fetched PR files list');
        return files;

    } catch (error) {
        console.error('Failed to get PR files:', error);
        return '';
    }
}

/**
 * Checkout PR branch for code inspection
 *
 * @param {string} branchName - Branch name to checkout
 */
function checkoutPRBranch(branchName) {
    try {
        console.log('Checking out PR branch:', branchName);

        // Configure git author
        cli_execute_command({
            command: 'git config user.name "' + GIT_CONFIG.AUTHOR_NAME + '"'
        });
        cli_execute_command({
            command: 'git config user.email "' + GIT_CONFIG.AUTHOR_EMAIL + '"'
        });

        // Fetch latest
        cli_execute_command({
            command: 'git fetch origin --prune'
        });

        // Check if branch exists locally
        const rawLocalBranch = cli_execute_command({
            command: 'git branch --list "' + branchName + '"'
        }) || '';
        const localBranch = cleanCommandOutput(rawLocalBranch);

        if (localBranch.trim()) {
            console.log('Branch exists locally, checking out');
            cli_execute_command({
                command: 'git checkout ' + branchName
            });
            // Pull latest changes
            cli_execute_command({
                command: 'git pull origin ' + branchName
            });
        } else {
            // Check if exists on remote
            const rawRemoteBranch = cli_execute_command({
                command: 'git ls-remote --heads origin ' + branchName
            }) || '';
            const remoteBranch = cleanCommandOutput(rawRemoteBranch);

            if (remoteBranch.trim()) {
                console.log('Branch exists on remote, checking out with tracking');
                cli_execute_command({
                    command: 'git checkout -b ' + branchName + ' origin/' + branchName
                });
            } else {
                throw new Error('Branch not found locally or remotely: ' + branchName);
            }
        }

        console.log('Successfully checked out branch:', branchName);

    } catch (error) {
        console.error('Failed to checkout PR branch:', error);
        throw error;
    }
}

/**
 * Write PR context files to input folder
 *
 * @param {string} inputFolder - Input folder path
 * @param {Object} prDetails - PR details object
 * @param {string} diff - PR diff
 * @param {string} files - PR files list
 */
function writePRContext(inputFolder, prDetails, diff, files) {
    try {
        // Write PR info
        let prInfo = 'h2. Pull Request Information\n\n';
        prInfo += '*PR #*: ' + prDetails.number + '\n';
        prInfo += '*URL*: ' + prDetails.url + '\n';
        prInfo += '*Title*: ' + prDetails.title + '\n';
        prInfo += '*Author*: ' + (prDetails.author ? prDetails.author.login : 'unknown') + '\n';
        prInfo += '*Branch*: ' + prDetails.headRefName + ' → ' + prDetails.baseRefName + '\n';
        prInfo += '*State*: ' + prDetails.state + '\n';
        prInfo += '*Files Changed*: ' + prDetails.changedFiles + '\n';
        prInfo += '*Additions*: +' + prDetails.additions + '\n';
        prInfo += '*Deletions*: -' + prDetails.deletions + '\n';
        prInfo += '*Created*: ' + prDetails.createdAt + '\n';
        prInfo += '*Updated*: ' + prDetails.updatedAt + '\n\n';

        if (prDetails.body) {
            prInfo += 'h3. PR Description\n\n' + prDetails.body + '\n';
        }

        file_write({
            path: inputFolder + '/pr_info.md',
            content: prInfo
        });

        // Write PR diff
        file_write({
            path: inputFolder + '/pr_diff.txt',
            content: diff || 'No diff available'
        });

        // Write PR files list
        file_write({
            path: inputFolder + '/pr_files.txt',
            content: files || 'No files list available'
        });

        console.log('✅ PR context written to input folder');

    } catch (error) {
        console.error('Failed to write PR context:', error);
        throw error;
    }
}

/**
 * Main action function
 * Prepares PR context for AI review
 *
 * @param {Object} params - Parameters from Teammate job
 * @param {string} params.inputFolderPath - Path to input folder
 * @param {Object} params.ticket - Jira ticket object
 * @returns {Object} Result object
 */
function action(params) {
    try {
        const inputFolder = params.inputFolderPath;
        const ticketKey = inputFolder.split('/').pop();
        const ticket = params.ticket;

        console.log('=== Preparing PR for review:', ticketKey, '===');

        // Step 1: Find PR associated with ticket
        const pr = findPRForTicket(ticketKey);
        if (!pr) {
            const errorMsg = 'No Pull Request found for ticket ' + ticketKey;
            console.error(errorMsg);

            // Post comment to Jira
            try {
                jira_post_comment({
                    key: ticketKey,
                    comment: 'h3. ⚠️ PR Review Setup Failed\n\n' +
                        'Could not find a Pull Request associated with this ticket.\n\n' +
                        'Please ensure:\n' +
                        '* A PR has been created with ticket key in title or branch name\n' +
                        '* The PR is open and accessible\n' +
                        '* GitHub CLI (gh) is properly authenticated'
                });
            } catch (commentError) {
                console.error('Failed to post error comment:', commentError);
            }

            return {
                success: false,
                error: errorMsg
            };
        }

        // Step 2: Get detailed PR information
        const prDetails = getPRDetails(pr.number);
        if (!prDetails) {
            const errorMsg = 'Failed to fetch PR details for PR #' + pr.number;
            console.error(errorMsg);
            return {
                success: false,
                error: errorMsg
            };
        }

        // Step 3: Fetch PR diff and files
        const diff = getPRDiff(pr.number);
        const files = getPRFiles(pr.number);

        // Step 4: Checkout PR branch for code inspection
        try {
            checkoutPRBranch(prDetails.headRefName);
        } catch (branchError) {
            console.warn('Could not checkout PR branch (non-fatal):', branchError);
            // Continue even if checkout fails - we have diff and files
        }

        // Step 5: Write PR context to input folder
        writePRContext(inputFolder, prDetails, diff, files);

        // Step 6: Post "review started" comment to Jira
        try {
            jira_post_comment({
                key: ticketKey,
                comment: 'h3. 🔍 Automated PR Review Started\n\n' +
                    '*Pull Request*: [PR #' + prDetails.number + '|' + prDetails.url + ']\n' +
                    '*Branch*: {code}' + prDetails.headRefName + '{code}\n' +
                    '*Files Changed*: ' + prDetails.changedFiles + '\n\n' +
                    'AI Code Reviewer is analyzing the pull request for:\n' +
                    '* 🔒 Security vulnerabilities\n' +
                    '* 🏗️ Code quality & OOP principles\n' +
                    '* ✅ Task alignment with requirements\n' +
                    '* 🧪 Testing adequacy\n\n' +
                    '_Review results will be posted shortly..._'
            });
        } catch (commentError) {
            console.warn('Failed to post review started comment:', commentError);
        }

        console.log('✅ PR review setup completed successfully');
        console.log('PR #' + prDetails.number + ' ready for AI review');

        return {
            success: true,
            prNumber: prDetails.number,
            prUrl: prDetails.url,
            branchName: prDetails.headRefName
        };

    } catch (error) {
        console.error('❌ Error in preparePRForReview:', error);

        // Try to post error to Jira
        try {
            const ticketKey = params.inputFolderPath.split('/').pop();
            jira_post_comment({
                key: ticketKey,
                comment: 'h3. ❌ PR Review Setup Error\n\n' +
                    '{code}' + error.toString() + '{code}\n\n' +
                    'Please check the workflow logs for details.'
            });
        } catch (commentError) {
            console.error('Failed to post error comment:', commentError);
        }

        return {
            success: false,
            error: error.toString()
        };
    }
}

// Export action function
module.exports = { action };
