# Suno UI

An independent, interactive prototype of Suno's mobile interface, built with Expo, React Native, and TypeScript.

Explore editable creation forms, a sample music library, and working audio playback. Creation uses prerecorded examples; it does not generate music or connect to a Suno account.

[Live demo](https://suno-ui.edgeone.cool) · [Explore the prototype](#explore-the-prototype) · [Run locally](#run-locally) · [Scope and limitations](#scope-and-limitations)

## Explore the prototype

| Area | Things to try |
|---|---|
| Create | Switch between Simple and Advanced, edit lyrics and styles, open the text editors, and save a local example to your library. |
| Search | Browse the sample catalogue and open Morning Light in the full player. |
| Player | Play and pause sample recordings, seek, change tracks, and open song actions. |
| Library | Find local examples, like songs, and organise them into playlists. |
| Hooks | Browse sample music clips and the inspiration entries. |
| Profile | Edit local profile details and explore settings and subscription screens. |

### A first walkthrough

1. Open **Search**, then open **Morning Light** in the player.
2. Play and pause the recording, then close the player.
3. Open **Create**, switch to **Advanced**, and enter lyrics, styles, and a title.
4. Choose **Create**, select a prerecorded example, and save it to **Library**.

The example keeps your entered details. The lyrics and prompt do not change its audio. Profile edits, playlists, and other local changes do not update the official Suno service.

## Run locally

Use Node.js 22.13 or newer in the Node.js 22 release line, with npm.

```bash
npm ci --ignore-scripts
npm run web
```

Open the local URL printed by Expo. Dependency installation requires an internet connection. No Suno credentials or API key are required for the sample catalogue.

### Build for the web

```bash
npm run typecheck
npm run build:web
```

The static output is written to `dist/`. Serve that directory over HTTP or HTTPS; opening `index.html` directly as a local file is not supported. Camera and microphone features depend on browser permissions and a secure context, such as HTTPS or localhost.

## Scope and limitations

- **Mobile layout on the web.** At wider viewport sizes, the interface remains a centred column up to 480 CSS pixels wide. It is not a separate desktop dashboard.
- **Sample content.** Songs, artwork, profiles, and social activity use demonstration content. The sample catalogue is limited.
- **Local simulation.** Music generation, credits, subscriptions, and social actions are simulated. No purchase or official Suno account change occurs.
- **Browser storage.** Local data belongs to this browser and origin. Clearing site data removes it; it does not sync between devices.
- **Validation scope.** Selected flows and responsive layouts have been checked in Chromium. This does not establish complete feature coverage, full visual equivalence, Safari/Firefox compatibility, or native Android/iOS acceptance.

## License

The prototype's original code and materials are **source-available for noncommercial self-directed study and research only**, under the [M620 Study and Research License](LICENSE). Commercial products, business use, client deliverables, and hosted services are not permitted without a separate written license. Free access does not itself permit commercial use.

This is not an open-source license. Third-party components retain their own licenses.

## Attribution

This is an independent prototype by M620, not an official Suno product and not affiliated with or endorsed by Suno. Third-party names identify the interface being demonstrated.

Third-party components retain their own licenses. See the [third-party notices](public/third-party-notices.txt); the Web build also serves this file at `/third-party-notices.txt`.
