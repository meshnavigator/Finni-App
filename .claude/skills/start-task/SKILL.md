---
name: start-task
description: Start an existing project task by validating its scope, synchronizing the integration branch, creating a task branch, and optionally marking a linked issue in progress. Use only when the user asks to begin implementation.
---

# Start Task

Read the task file, config and Git status. Stop on unrelated uncommitted changes,
a closed/cancelled task, or an existing conflicting branch. Resolve the branch
as `{task-id}/slug`, update the configured integration branch, and create the
task branch from its current tip.

If `repository` is configured and external updates were requested, comment with
the branch name and move the issue/card to In Progress. Verify the active branch
and remote/task linkage. Do not implement task scope as part of this skill unless
the request includes implementation.
