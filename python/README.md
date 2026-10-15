# Python component

Python will be added in a later stage of this project for tasks such as:

- Connecting to BigQuery and retrieving results
- Validating query outputs against expected totals
- Automating data refresh steps
- Building a small conversational analytics interface

The project starts with SQL so the metric logic is easy to inspect and validate.

## Planned approach

1. Keep credentials out of the repository.
2. Use environment variables or an approved Google Cloud authentication method.
3. Add Python dependencies only when the first script is introduced.
4. Document how to run each script and what output to expect.
