---
name: "Agent Task 01: Order status transitions"
about: "First hands-on task for a GitHub coding agent"
title: "Prevent invalid order status transitions"
labels: ["agent-exercise", "bug"]
assignees: []
---

## Goal

Prevent orders from moving through invalid status transitions while preserving the existing API behavior for valid transitions.

## Current problem

`OrderService.UpdateStatus` currently accepts any recognized `OrderStatus`. This allows impossible flows such as `Created → Shipped` and `Shipped → Paid`.

## Required behavior

Allowed transitions:

- `Created → Paid`
- `Paid → Shipped`

All other transitions are invalid, including transitions to the current status.

## Acceptance criteria

- [ ] `Created → Paid` succeeds.
- [ ] `Paid → Shipped` succeeds.
- [ ] Every other transition returns HTTP `400 Bad Request`.
- [ ] An unknown textual status returns HTTP `400 Bad Request`.
- [ ] Updating an order that does not exist still returns HTTP `404 Not Found`.
- [ ] Automated tests cover every valid and invalid transition.
- [ ] Existing create and get behavior remains unchanged.
- [ ] No unrelated refactoring is included.

## Agent workflow requirement

Before editing code, provide a short plan containing:

1. The files you expect to change.
2. The tests you will add or update.
3. Any ambiguity or risk you identified.

After implementation, open a pull request and report the validation commands and results.
