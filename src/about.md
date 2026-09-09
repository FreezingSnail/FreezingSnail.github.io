---
layout: post.njk
theme: theme-kelp-light
title: About
description: Systems software, developer tools, and agent infrastructure.
permalink: /about/
---

## What I work on

I write backend systems and developer tools. Lately that has meant infrastructure for coding agents, code intelligence, and reliability work for distributed services: idempotent retries, useful traces, test fixtures that reproduce production failures, and interfaces that make system boundaries obvious.

I care less about automation as a spectacle than whether a change is easy to inspect, review, and undo. Small interfaces, explicit contracts, boring recovery paths.

## Projects

### Magicite

A Go daemon for implementation work across multiple repositories: isolated worktrees, specialized coding agents, task claims, review, repair, and deliberate landing.

### Maduin and Chaplet

Emacs-native tooling for orchestrating agent crews, task graphs, dashboards, and review inboxes. Built around keeping automated work inspectable rather than hiding it behind a single command.

### Proof

A Go snapshot-testing library. Durable test artifacts and readable diffs make regressions easier to pin down and production bugs quicker to replay.

## Tools I reach for

Go, Rust, C/C++, Python, Elixir, and TypeScript; gRPC, Kubernetes, Kafka, Redis, PostgreSQL, Terraform, Docker, AWS, Protobuf, OpenAPI, and observability tooling. For agent systems: MCP, orchestration, spec-driven development, and evaluation.

## Arduboy work

A long-running small-machine corner of the project archive. **CreatureGathererFX** is a creature-collecting demake for Arduboy FX, supported by data and asset tooling. **Warlock** is a Wizardry-inspired demake. **AllYourArduFX** updates a shoot-'em-up for FX hardware, while **ATMlib2FX** ports the ATM library to that platform; companion work includes fonts, audio conversion, game-data tools, and FX demos.

Those projects are a useful counterweight to service work: tight memory, fixed inputs, data pipelines that have to fit, and the satisfaction of a complete thing running on a tiny device.

## Elsewhere

I also make game-data tools, simulators, compilers, and language experiments. Small constrained projects are a good way to find out where an abstraction costs too much, or where a tool can stay simple.
