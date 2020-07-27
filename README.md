# cicdplugin



GET /sn_cicd/testsuite/results/{result_id}
The API returns these JSON or XML elements in the response body.
child_suite_results	Results of nested test suites. The format of this content is the same as the parent test.
error	Error message.
links	Object that contains all links and sys_ids associated with the response.
links.results	Object that contains the results information.
links.results.id	Unique identifier of the results information. Use this value when calling the endpoint /sn_cicd/testsuite/results/{result_id}.
links.results.url	URL to use to obtain the results of the endpoint execution, such as results.
percent_complete	Percentage of the request that is complete.
rolledup_test_error_count	Number of tests with errors.
rolledup_test_failure_count	Number of tests that failed.
rolledup_test_skip_count	Number of tests that were skipped.
rolledup_test_success_count	Number of tests that ran successfully.
status	Numeric execution state. Used with status_label, such as 0: Pending.
Values:
0 (Pending)
1 (Running)
2 (Successful)
3 (Failed)
4 (Canceled)
status_detail	Additional information about the current state.
status_label	Execution state description. Used with status, such as 0: Pending.
Values:
Pending
Running
Successful
Failed
Canceled
status_message	Description of the current state.
test_suite_duration	Amount of time that it took to execute the test suite.
Unit: Seconds

test_suite_name	Name of the test suite.
test_suite_status	State of the test suite.