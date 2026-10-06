# Interview scheduling verification

Run `npm ci --prefix tests` followed by `npm test --prefix tests` from the repository root. Node.js 24 is used for these tests. The jsdom dependency is for tests only; the deployed website has no new dependency.

## Result — 6 October 2026

67 automated tests pass. Tests execute the real save module and form script with synthetic data and controlled responses. No production bookings were created.

Covered:
- Every required field, invalid email/register ID/company/HR fields, whitespace-only names and Other technology.
- Missing, malformed, equal and reversed times; noon/midnight and AM/PM serialization.
- Time picker reopening; preservation of chosen hour, minute and period.
- Returning to an invalid earlier step and Enter-key navigation.
- Duplicate warning, preserved details, successful reset, error recovery, disabled controls and repeated submission.
- All eight duplicate-key dimensions and permitted reschedules.
- Case/spacing normalization and Sheets historical timestamp conversion.
- Transient network/HTTP/JSON errors, retry exhaustion, actual abort signals and stalled response bodies.
- Lost POST responses, delayed read visibility, uncertain-save retries, reload persistence, blocked storage and same-browser tab coordination.
- Malformed/incomplete read responses block writes rather than permit an unchecked save.

A browser check at 390 × 844 also verified required-time errors, reopened 4 PM selection, duplicate detection after two simulated connection failures, form retention and horizontal fit of the dialog and Save button.

## Issues fixed during this pass

1. Read-only time inputs bypassed required and range validation.
2. Reopening a quick-selected time could revert picker controls to 9 AM.
3. Whitespace-only names passed the required check.
4. Invalid earlier fields were left hidden at the final step.
5. Unescaped hyphens made three HTML validation patterns invalid under modern browser pattern rules.
6. Incomplete API row objects were not rejected before duplicate checking.

## Verification limits

The write endpoint is an external Google Apps Script with an opaque browser response. Its source is not in this repository. These tests do not verify atomic duplicate protection across different devices, direct API callers, or the server's own validation. The Apps Script source is needed to review those guarantees. Real production writes and changes to existing sheet rows were intentionally excluded. The responsive browser check is not a physical Android/iOS device certification. Google service availability cannot be guaranteed; uncertain saves remain protected from automatic resubmission.
