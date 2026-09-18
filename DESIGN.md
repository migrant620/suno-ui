---
version: alpha
name: Suno UI
description: An independent interactive music app prototype with warm neutral surfaces, editable creation forms, sample audio, and local playlists.
colors:
  surface: "#F7F4EF"
  ink: "#101012"
  toolbar: "#E0DEDA"
  handle: "#4E4D55"
  muted: "#85848C"
  placeholder: "#C9C6C1"
  disabled: "#A3A3A3"
  primary: "#FF399C"
  orange: "#FF702C"
  blue: "#0089FF"
  white: "#FFFFFF"
  border: "#C5BDBD"
typography:
  body:
    fontFamily: Roboto
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.3125
  heading:
    fontFamily: Roboto
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2142857
  section:
    fontFamily: Roboto
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.25
spacing:
  page: 16px
  small: 8px
  row: 12px
  section: 24px
rounded:
  sheet: 28px
  card: 24px
  input: 16px
  pill: 999px
---

## Overview

Suno UI presents an interactive mobile music interface in a browser. Main destinations include discovery, search, creation, and a local library. Wider windows retain a centred mobile column with a maximum width of 480 CSS pixels.

This is an independent prototype and is not affiliated with Suno. It does not connect to a Suno account. Generation, credits, subscriptions, and social actions are simulated.

## Colors

Light surfaces use warm off-white with near-black text. Pink and orange mark prominent creation controls; blue marks selected secondary actions. Input fields use `#EEEBE7`, secondary controls use `#E5E2DD`, and dividers use `#DDDAD5`.

Appearance settings offer Light, Dark, and System. Theme-aware dark surfaces use `#101012`, foreground text uses `#F7F4EF`, fields use `#19191B`, and controls and dividers use `#28282A`. Some screens retain light surfaces.

## Typography

Roboto Regular is used for body text and large headings; Roboto Medium is used for section labels and controls. The shared body style is 16 px with 21 px line height; heading text is 28 px with 34 px line height and 0.7 px letter spacing; section headings are 24 px with 30 px line height. Instrument Serif is used for selected promotional headings.

## Spacing and Layout

The common page inset is 16 px. Compact gaps use 8 px, rows use 12 px, and section spacing uses 24 px. Scrollable content sits above persistent navigation or player controls where applicable. Overlays stay within the mobile interface column.

## Components

- **Icon buttons:** 48 × 48 px touch targets with optional 40 px circular backgrounds.
- **Pills:** a 48 px touch row surrounding a 40 px visible pill; labels use Roboto Medium at 14 px with 17 px line height.
- **Sheets:** rounded upper corners, a 32 × 4 px handle, headings, scrollable content, and explicit dismiss controls.
- **Creation forms:** editable lyrics and styles, selectable options, expandable editors, and local attachment controls.
- **Music rows and cards:** artwork, title and supporting text, playback controls, and contextual actions.
- **Player:** sample audio playback, progress, and track information; bundled sample recordings are playable without an account.
- **Library:** local examples, playlists, and empty states. Local examples can remain after a browser refresh.

## Interaction States

Forms provide focus, selected, disabled, loading, error, and dismissal states where implemented. The Saved Lyrics/Styles naming dialog validates the entered name and shows an inline message while keeping Save disabled when the name is empty, duplicates an existing saved item of the same kind, or exceeds 40 characters. Creating a local example displays an explanation that no music is generated. The resulting item can be opened from the library.

Local storage belongs to the current browser and origin. Clearing browser data removes local examples and preferences. Media permission and file-selection behaviour depend on the browser and device.

## Platform Scope

The available interface is a Web prototype built with Expo, React Native, and TypeScript. It supports phone, tablet, and desktop viewport sizes while retaining a mobile layout. Native application distribution and complete equivalence with the official service are outside this prototype's stated capabilities.
