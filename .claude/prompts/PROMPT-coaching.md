# Coaching Task

## TASK
Analyze driver performance and manage coaching actions for DSPilot.

## TARGET
$DRIVER_OR_STATION

## ACTION TYPE
$ACTION_TYPE (analysis | create | evaluate | escalate)

## CONSTRAINTS

### Business Rules
- Follow escalation pipeline (discussion -> warning x3 -> suspension)
- Set follow-up dates based on action type
- Track DWC at action creation
- Record DWC at evaluation for effectiveness tracking

### Pipeline Rules
| Action Type | Default Follow-up |
|-------------|------------------|
| discussion | 7 days |
| warning | 14 days |
| training | 21 days |
| suspension | 30 days |

### Escalation Trigger
- 3 warnings without improvement = suggest suspension
- Status "no_effect" = prompt for escalation

## SUCCESS CRITERIA

### For Analysis
- [ ] Driver performance data retrieved
- [ ] Trend calculated (4 weeks)
- [ ] Main error categories identified
- [ ] Pipeline stage determined
- [ ] Recommendation generated

### For Create Action
- [ ] Valid driver and station
- [ ] Appropriate action type for pipeline stage
- [ ] Follow-up date set
- [ ] DWC recorded
- [ ] Action created in database

### For Evaluate
- [ ] Action exists and is pending
- [ ] Follow-up date has passed
- [ ] Current DWC retrieved
- [ ] Status updated based on outcome
- [ ] Notes recorded

### For Escalate
- [ ] Previous action evaluated as no_effect
- [ ] New action created at next level
- [ ] Escalation note recorded
- [ ] Timeline maintained

## PROCESS

### Analysis Flow
1. Get driver current stats
2. Get historical stats (4 weeks)
3. Calculate trend
4. Identify error patterns
5. Check existing actions
6. Determine pipeline stage
7. Generate recommendation

### Create Flow
1. Validate driver exists
2. Check pipeline stage
3. Set action type
4. Calculate follow-up date
5. Record current DWC
6. Insert action
7. Confirm creation

### Evaluate Flow
1. Get action details
2. Get current driver DWC
3. Calculate improvement
4. Determine outcome (improved/no_effect)
5. Update action status
6. Record evaluation notes
7. Suggest next steps

## COMPLETION SIGNAL

For analysis:
```
TASK_COMPLETE: Analysis complete for [driver name] - [recommendation summary]
```

For action creation:
```
TASK_COMPLETE: [action type] created for [driver name] - follow-up [date]
```

For evaluation:
```
TASK_COMPLETE: Action evaluated as [status] - DWC change: [X]%
```

For escalation:
```
TASK_COMPLETE: Escalated to [new action type] - follow-up [date]
```

## OUTPUT FORMAT

```
=== COACHING REPORT ===

Driver: [Name] ([amazonId])
Station: [Code]

Current Performance:
- DWC: XX.X% ([tier])
- IADC: XX.X%
- Rank: X/XX

Pipeline: Stage X/5
Last Action: [type] on [date] - [status]

[Action-specific details]

Next Steps:
- [recommendation]
```
