# Main Admin Guide

## Main admin identity

The protected main admin account is:

- `admin@scorlo.in`

This account is special in the app and cannot be deleted by other admins.

## Main admin access

The main admin has access to:

- Overview
- Admins
- Users
- Students
- Issues
- Maintenance

## What the main admin can do

### Overview

Review:

- total users
- total admins
- linked accounts
- pending requests
- rejected links
- total students
- ranking row count
- recent logins
- recent admin actions

### Admins

Create new admin accounts with:

- name
- email
- password

Notes:

- admins created here are automatically marked email-verified
- the main admin remains protected
- non-main admin accounts can be deleted here

### Users

Manage student app accounts, including:

- search student-linked app users
- update student link data
- review pending data requests
- approve or reject requests
- delete student app users

### Students

Browse academic student records, open a student profile, and inspect:

- linked status
- branch and batch
- CGPA and percentage
- active and cleared backs
- semester history
- student ranks

The student table is interactive and fetches only table data while filters or paging change.

### Issues

Review the support queue and update:

- issue status
- admin notes

### Maintenance

Run protected maintenance operations:

- rebuild rankings
- rebuild dashboard cache
- clear dashboard cache
- auth cleanup

These are destructive or operational controls and are restricted to the main admin.

## Security model

Main-admin-only restrictions are enforced:

- in the UI
- and at the API layer

That means hidden controls are not the only protection.

## Recommended operating flow

1. Check Overview for system health.
2. Review Issues and student account problems.
3. Use Users for link and request handling.
4. Use Students for academic inspection.
5. Use Maintenance only when needed.
