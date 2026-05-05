# Lifemode App Documentation

## Overview

Lifemode is a mobile-first reflection and decision-making prototype. The app is designed to help a user think clearly about a life situation, move through a guided conversation, and save useful takeaways into a wisdom archive.

The current codebase is a UI prototype only. There is no backend, persistence layer, or live AI service connected yet.

## Main Features

### 1. Guided onboarding flow

The app starts with a short onboarding sequence:

- Landing page with the product message
- Intent selection to choose the kind of support the user wants
- Thought capture to enter the main concern
- Mode selection between quick clarity and a deeper session
- Account creation screen

This flow is meant to set up the first reflection session with minimal friction.

### 2. Session-based reflection

The core product experience is the guided session flow:

- Start a session from the home screen
- Chat or freeform reflection entry
- Reflection screen that surfaces an emotional interpretation
- Decision screen that helps the user compare options
- Summary screen that captures the outcome
- Completed session state that marks the session as finished

The app also includes a small emotion-analysis helper in the code. It classifies the user’s message into an emotion family such as anger, fear, sadness, disgust, enjoyment, mixed, or unclear, then generates follow-up framing and a Socratic question.

### 3. Home dashboard

The home screen acts as the primary hub. It includes:

- Greeting and current context
- A prominent "Start a session" entry point
- Quick options for common themes like career, relationships, decisions, and anxiety
- A continue-where-you-left-off card
- Bottom navigation to the main sections of the app

### 4. Sessions management

The sessions area provides history and progress tracking:

- List of active and completed sessions
- Search field
- Filter chips for session status
- Progress indicators for in-progress sessions
- Empty state when no sessions exist

### 5. Paths and guided programs

The paths section presents structured multi-step flows, such as career clarity and relationship decision paths.

The path experience includes:

- Featured paths
- Path detail pages
- Step-based path progression
- Time estimates and outcome descriptions

### 6. Insights and patterns

The insights area surfaces recurring themes from prior sessions:

- Pattern cards with summaries
- Decision history
- Pattern detail pages
- Pattern comparison screen

This is where the product shows its memory and reflection value over time.

### 7. Wisdom archive

Completed sessions can be turned into saved wisdom. The archive includes:

- Archived session takeaways
- A detail page for a specific piece of wisdom
- Tags and source session context

### 8. Account, premium, and settings

The app includes account and monetization-related screens:

- Profile
- Premium upgrade
- Billing management
- Preferences
- Notifications
- Help and support

### 9. Empty states

There is a dedicated empty-states screen set to show fallback content for cases such as:

- No sessions yet
- No insights yet
- No saved wisdom yet
- No search results

This helps the design cover dead-end scenarios instead of leaving them undefined.

## Current Pages

The app currently defines 30 screens.

### Onboarding

- `Landing`
- `Intent`
- `Thought`
- `Mode`
- `Account`

### Core session flow

- `Session Setup`
- `Home`
- `Session Detail`
- `Chat`
- `Reflection`
- `Decision`
- `Summary`
- `Completed Session`

### Session library

- `Sessions`
- `Sessions Empty`

### Paths

- `Paths`
- `Path Detail`
- `Path Steps`

### Insights

- `Insights`
- `Pattern Detail`
- `Pattern Compare`

### Wisdom archive

- `Wisdom Archive`
- `Wisdom Detail`

### Monetization and account

- `Premium`
- `Billing`
- `Notifications`
- `Profile`
- `Preferences`
- `Help`
- `Empty States`

## Navigation

The app uses two main navigation patterns:

- A top-level screen selector in the prototype shell for switching between all screens
- A bottom navigation bar in the primary app areas: Home, Sessions, Paths, Insights, and Profile

Most screens are connected through button-driven transitions rather than URL routes.

## Key Implementation Notes

- The app is built with React, TypeScript, and Vite.
- The UI is styled with Tailwind CSS.
- `src/LifemodeApp.tsx` contains the full prototype screen map and most of the UI logic.
- `src/main.tsx` mounts `LifemodeApp` into the root element.

## Suggested Next Step

If you want, this documentation can be split into:

1. A product overview for non-technical readers
2. A developer-facing screen map with transitions
3. A feature spec for building the backend next
