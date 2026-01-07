# Import Data Task

## TASK
Process and validate Amazon DWC/IADC data import for DSPilot.

## INPUT
$INPUT_DESCRIPTION

## CONSTRAINTS

### Data Integrity
- Validate all CSV data before inserting
- Check foreign key relationships
- Ensure no duplicate entries
- Verify station code matches

### Business Rules
- DWC values must be 0-100%
- Week numbers must be 1-53
- All drivers must have valid amazonId
- Tier must match DWC thresholds

### Safety
- Delete existing data for week before re-import
- Generate alerts after successful import
- Log all errors and warnings
- Never corrupt existing data

## SUCCESS CRITERIA

- [ ] HTML file parsed successfully
- [ ] All CSVs extracted and decoded
- [ ] Station code validated
- [ ] Driver data inserted/updated
- [ ] Daily stats inserted
- [ ] Weekly stats inserted
- [ ] Station stats updated
- [ ] Alerts generated
- [ ] Import record created with correct status

## PROCESS

1. **Parse**: Extract CSVs from HTML
2. **Validate**: Check data integrity
3. **Clear**: Remove existing week data (if re-import)
4. **Insert**: Add new data to database
5. **Aggregate**: Update station-level stats
6. **Alert**: Generate KPI alerts
7. **Record**: Log import with status

## COMPLETION SIGNAL

When import succeeds:
```
TASK_COMPLETE: Import successful - [X] drivers, [Y] daily stats, [Z] weekly stats
```

When import partially succeeds:
```
TASK_PARTIAL: Import completed with warnings - [list warnings]
```

When import fails:
```
TASK_FAILED: Import failed - [error description]
```

## VALIDATION CHECKS

```
- [ ] Station code extracted
- [ ] Year/week detected
- [ ] Driver count > 0
- [ ] No negative values
- [ ] No invalid percentages
- [ ] All required fields present
```
