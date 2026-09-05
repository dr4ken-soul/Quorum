# Quorum Route Map

## Public routes

| Route | Purpose | Data policy |
|---|---|---|
| `/` | Kinetic editorial landing page | Static content only |
| `/demo` | Fixed sample-case replay | Fictional, clearly labelled sample data |
| `/privacy` | Retention, deletion, and data-use explanation | Static content |
| `/docs` | Commands, evidence labels, and limitations | Static content |

## Optional case routes

| Route | Purpose | Access |
|---|---|---|
| `/app` | User case index | Photon identity required |
| `/app/cases/[caseId]` | Case receipt and exhibits | Case participant or owner |
| `/app/settings` | Retention and notification preferences | Photon identity required |

## Agent command routes

These are message intents, not public URLs:

- `PUT THIS ON TRIAL`: open a group case
- `SHOW WORK`: list exhibits and unresolved risks
- `VOUCH`: submit supporting testimony
- `OBJECT`: submit an objection
- `UNKNOWN`: record that the participant cannot verify the claim
- `REOPEN CASE`: continue deliberation after a ruling
- `CLOSE CASE`: close the case and begin retention countdown
