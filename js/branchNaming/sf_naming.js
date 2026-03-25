/**
 * Salesforce repository branch naming strategy.
 *
 * Produces:
 *   development role → ai/<TICKET-KEY>          (LLM working branch)
 *   feature role     → Feature/ft_ai_<TICKET-KEY> (PR target, follows SF repo convention)
 *   test role        → test/<TICKET-KEY>
 *
 * Matches the PostNL-commercial repo convention:
 *   Feature/ft_<team>_<TICKET-KEY>_<summary>
 * where the AI team identifier is "ai".
 *
 * Usage in agent customParams:
 *   "branchNamingFnPath": "agents/js/branchNaming/sf_naming.js"
 */
module.exports = function(ticket, branchRole) {
    var key = ticket && ticket.key || 'UNKNOWN';
    if (branchRole === 'feature') {
        return 'Feature/ft_ai_' + key;
    }
    if (branchRole === 'test') {
        return 'test/' + key;
    }
    // development (default)
    return 'ai/' + key;
};
