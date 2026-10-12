---
version: alpha
name: Suno Android Creation
description: Warm neutral editing surfaces, dark typography, translucent pills and a vivid pink-orange creation accent. Representative implementation in progress.
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
    lineHeight: 1.2
  heading:
    fontFamily: Roboto
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.2
  section:
    fontFamily: Roboto
    fontSize: 24px
    fontWeight: 500
    lineHeight: 1.2
  caption:
    fontFamily: Roboto
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.2
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

The reference is Suno Android 1.88.0 (410), English, light creation surfaces. This document currently covers the creation form, expanded text editor, audio attachment and Library/playlist surfaces. It is not a completed system for every Suno screen.

## Colors

Measured editor surface: `surface`; measured text foreground: `ink`; toolbar fill: `toolbar`; drag handle: `handle`. The remaining colors are provisional samples or implementation candidates pending region-by-region comparison. The creation background and accent are animated, grainy fields, not one flat gradient or a static screenshot.

## Typography

Body 16 and heading 28 logical units are candidates derived from observed bounds and glyphs. Roboto is the first render candidate; exact face/weight matching remains pending. Bundled app font names alone do not establish which font a screen uses. Use licensed font packages; proprietary reference font files are not delivery assets.

## Layout

Reference width 1080 physical pixels at 440 dpi converts to about 393 logical units using 2.75 pixels per dp. Editor side margin is measured at 44 pixels (16 dp). Toolbar icon boxes are 66 pixels (24 dp), with 132-pixel (48 dp) centers. Drag handle is 88×11 pixels (32×4 dp). The editor text grows into available space; its toolbar stays above the keyboard. Native system bars and keyboard belong to the platform, not app screenshot assets. Measured status/cutout inset is 136 physical pixels and navigation inset is 66; the app content viewport is about 393×777 logical units. Web excludes these system insets rather than reserving them again.

## Elevation & Depth

Expanded editors use a warm opaque sheet over a dimmed background. Saved-text menus and naming dialogs float above it. Toolbar shadows and animated background colors remain to be quantitatively matched; do not mark them accepted from the first render.

## Shapes

Pill buttons, rounded sheets and softly rounded cards are characteristic. Current corner tokens are geometry candidates requiring rendered comparison. The drag handle and the editor margins are measured values.

## Components

Creation form: Simple prompt, shared Lyrics/Styles/Title, mode toggle, model menu and global clear. Expanded editor: real multiline input, independent undo/redo history, reset, saved-item list, naming/rename dialog, delete, enhancement state and Done. Changes survive closing the editor and mode changes. Global clear affects both modes; editor undo affects its own field.

### Audio selection and attachment

The song picker uses a 72 dp row pitch, 56 dp square cover, and title origin 88 dp from the left edge, derived from observed Android bounds. Selecting a song first previews it; Continue applies it. Empty Simple forms stay Simple and expose an inline audio chip. Playback position survives Simple/Advanced switching. Cover and Extend share a real player; Extend exposes an adjustable start point. Sample waveform bars come from the supplied audio, not a decorative screenshot.

Audio attachments and their edit settings persist locally. If the saved file is unavailable or its metadata cannot be read, show an explicit recovery notice and a Discard unavailable audio action. Discarding that attachment preserves the text draft. This is a local recovery behavior, not a claim about Suno's backend.

### Library and playlists

Library category cards measure 164×124 dp, left margin 16 dp and gap 12 dp. A horizontally scrollable strip preserves their size on narrow screens. Library and Playlists titles use a 28 dp bold face candidate; exact glyph matching remains pending. Playlist detail covers measure 210×210 dp; editing uses 172×172 dp. Covers have a candidate 20 dp radius. List covers are 56 dp with 72 dp row pitch; grid uses two columns separated by 16 dp. New-playlist cards are genuine controls with a plus icon.

The inactive playlist filter fill measures #EDEAE6 and header control fill #EEEBE7 in the reviewed reference interior regions (private evidence in spec/library-design-evidence.json). The playlist header has 40 dp circular controls and a 76 dp region; the title/filter regions follow below it. Search replaces that header with a 48 dp input and a separate close control. The four filters select the actual ownership groups. Liked Songs is a system playlist and is not returned as an ordinary playlist search result in the observed empty account.

New-playlist creation uses a separate sheet, autofocus, a centered 28 dp name input, visibility switch and 56 dp submission button. Empty/whitespace names disable submission. Creation closes to the originating list and retains its filter. Editing is a full page with cover, name, optional description limited to 200 characters, visibility and Save; cancellation preserves the original values. Detail pages hide bottom navigation. Returning from Create to Library restores the last Library detail, and Back restores its originating list.

Keep the creation sheet's visibility switch and submission button above the platform keyboard, including in the standalone Android build.

Local data persists across reloads; public visibility operates only within the demo. The prototype does not publish playlists to Suno. Generated raster covers and illustrations are original approximations; their color field, grain density and shape matching are not yet visually accepted.

Playlist song selection remains open while each row plus/check immediately adds/removes membership. The heading counts additions in the current sheet session; reopening resets that count and its checks, and re-adding an existing song does not create a duplicate. Tapping a song row previews it and shows the mini-player; tapping the same row again pauses, clears its highlight and closes the mini-player. The creation picker retains its separate Continue action.

The observed populated playlist uses a 240×40 dp Play button plus 40 dp Share and Download controls. Its 56 dp song covers precede the created date and Add Songs button. Search and Sort appear in the top controls; Create Songs is absent in the observed populated state. These measurements are recorded in private spec/playlist-detail-design-evidence.json; the full populated detail behavior and rendered geometry remain in progress.

### Main navigation and local collections

All five bottom navigation controls open actual screens. Hooks uses a dark local feed with real audio controls; Search filters the local catalog and playlists, and Library search limits results to saved content. Profile edits, collections and the Reduce motion preference persist on the device. Query state survives switching tabs. These screens remain functional candidates. Fresh original Search/Profile/Settings/Appearance references now exist; the discovery screen, typing/submitted search states, underlined result tabs, profile cover and setting rows still require implementation and full visual verification.

Saving a local example explicitly selects prerecorded audio. Titles, lyrics and styles are editable metadata; they do not synthesize music. Saved examples appear in Library, search and Profile, and support real playback, playlists, sharing and reuse. Deleting a local song requires confirmation and removes its collection memberships.

### Song comments

The observed comment sheet uses #1C1C1F background, #C2C2C1 body text, #6A6A72 secondary text, #FD429C timestamp accent and #252529 composer fill. Comments use 32 dp avatars and a 58 dp text origin; the composer avatar and initial input height are 44 dp. Header and row spacing have been reviewed against a paired mobile reference. Lawful local text and avatars differ; the disclosure line also changes the bottom spacing. These comparisons do not establish full visual acceptance.

Local comments support timestamp seeking in the actual player, expansion, likes, replies, copy and deletion of the user's own local content. Closing preserves both text and reply target. Posting and deletion update the local count and persist independently of the source service. Keep reply submission usable above the native keyboard. Original comment submenus, full keyboard geometry and recovery branches remain pending.

Shared local songs retained by a recipient's likes or playlists retain their metadata after the share URL is removed. Keep received tracks distinct from self-created songs in Profile.

### Local recording behavior

Record opens a genuine audio recorder. Request microphone permission on the explicit start action; show permission errors and reject recordings shorter than six seconds. Provide stop, preview, record again and use controls. Closing the panel stops microphone input. Accepted audio persists as a local attachment. Browser synthetic-input functional validation does not establish physical microphone or native recording quality. Voice now has a separate full-height entry sheet and its own Recents/Public/Liked song picker. The picker returns to Voice, and file-picker cancellation retains the entry. Hold or double-tap requests microphone access; Not Now preserves the entry. Accepted files and recordings open an explicitly local sample preview, then may attach as audio. Voice cloning, nonempty source selection, metadata and creation-result parity remain unimplemented/unverified.

## Do's and Don'ts

Use actual text, inputs, controls and data. Never embed a reference screen, control crop or hotspot shell. Identify sample generation and do not imply access to Suno's service. Preserve missing-state records until implemented and tested.

## Responsive Behavior

The reference width is mobile first. Desktop previews center a bounded app surface; this is a proposed adaptation, not a captured Suno desktop layout. Android uses native safe-area and keyboard insets. iOS and mini-program behavior are unverified.

## Iteration Guide

Change the design value here, regenerate platform tokens, compare the affected state and rerun interaction checks. Runtime code must not access private references or shared workspace paths.

## Known Gaps

Exact font matching, animated grain/aura, icon silhouettes, shadow parameters, all remaining modules and cross-platform fidelity remain unverified. A successful lint or build is not visual acceptance. This internal development document requires outcome-only review before publication.

### Search and public creator refinement

Search has separate discovery, typing suggestions and submitted results. Submitted categories use an underline, with All, Songs, Creators, Playlists and Hooks. Refocusing the input preserves results; changing text returns to suggestions. Category taps preserve the native keyboard. Search navigation hides while the keyboard is visible. Close clears the query and returns discovery; creator and playlist detail returns preserve the search state.

The measured search field is 48 dp high, with 16 dp horizontal page padding and a separate 40 dp round action. Results use 56 dp covers and 76 dp row pitch. Discovery featured covers are 153 dp square. Hooks results use a two-column, edge-to-edge grid with approximately 196 × 244 dp cells. Public creator identity uses a 76 dp avatar, 28 dp name and 44 dp follower pills. Its abstract background is a separate original raster asset, never a screen image.

Creator follows, follower lists and share links use the local example identity. The creator page is separate from the editable local listener profile. Shared creator links must open correctly in a fresh browser context. The source creator menu, relationship lists, populated Voices, photo-to-song camera/blanks flow, discovery collection destinations and Hooks video result journey remain incomplete. Candidate functional controls for those branches do not establish source fidelity. Current discovery has only two original recordings and does not match the source's content density. Native platform checks and matched visual comparisons remain necessary.

### Profile editor

The editor opens as a full-screen scrolling page with fixed Back and Save actions. A 272 dp cover region contains a 76 dp avatar and editable identity preview. Two 56 dp image action pills precede grouped name/username fields, a 152 dp biography field, and six 61 dp social-link rows. Use 20 dp page margins and 24 dp group radii. The initial unchanged form disables Save. Cancel discards only the local draft, while successful save returns to its actual entry (Profile or Settings).

Profile Photo and Cover Image each open an image-source sheet with gallery and camera actions. Selected image data is persisted with the local profile and shown in the profile and navigation avatar. Actual native camera/file picking remains separately verified from browser file selection. Profile text/link/image changes do not update a Suno account. Local validation currently bounds names, usernames, biography and URLs; those limits are candidate behavior until original validation states are observed. Source identity, text, photos and private research are never included in the example profile.

### Download allowance and subscription routes

My Downloads is an allowance screen, separate from offline playlist caching. Its 16 dp page inset, 76 dp summary block, 24 dp explanation line height and fixed 56 dp upgrade action follow the observed free-account state. Get More Downloads opens the Pro promotion, which leads to download packs or all plans. Back restores the preceding page and selection. Settings My Subscription directly opens all plans.

All plans has monthly/annual billing and Pro/Premier radio cards. The measured first/second cards are approximately 194/170 dp tall with 24 dp feature pitch. Download packs offer 1/3/5/10 credits in approximately 70 dp rows. The 164 dp hero-to-body transition uses an original cassette image. Instrument Serif is a licensed, bundled candidate for the condensed display serif; exact source font identity remains unverified. Its SIL OFL notice accompanies the font.

A separate, visibly labeled demo checkout handles review, processing, cancellation, failure/retry and success. Prices reproduce frozen reference display data; no money, Suno subscription, commercial rights or service credits are issued. A successful local transaction saves before displaying success and increments the example allowance exactly once. Local plan selection also governs the Create model selector and survives restart where tested. Demo Terms/Privacy explain this local data boundary; they do not replicate Suno's external policy pages. Original store checkout, real subscription management, nonempty source allowance and download-credit consumption paths remain pending.

### Own profile and completion entry

Own Profile uses a fixed four-action header over a fading cover, a 76 dp avatar, identity and Edit pill. The empty reference includes a completion card, 140 × 180 dp horizontal creator cards, Songs empty rows with a real creation CTA, and a 104 dp lower identity card. It does not show the previous candidate Songs/Playlists/Liked tabs. Liked songs and playlists remain available through Library and share the same local data. Source populated-account variants still require observation.

Recommended creators use original demo identities and artwork. Card entry and return retain the own-profile scroll position. Follow state is persisted and shared with each creator page; browser toggle state uses explicit aria-pressed. Native own-profile sharing opens the platform share sheet; Web copies a disclosed name/username/bio snapshot that opens in a separate receiver session. Photos and songs are not currently included, which remains a full-profile sharing gap.

The observed completion entry has separate name and photo screens, Step 1/4 and Step 2/4. Name Next advances and retains progress; photo Next is disabled until an image exists. Actual local image selection is supported. Source steps 3/4 are unobserved: the local candidate continues to the existing profile editor and labels that transition. It must not be counted as the original four-step flow. Notifications now uses the full-page implementation described below; populated source variants remain unobserved. These and exact cover/grain, typography, global selected navigation style and motion remain open.

### Notifications

Notifications is a full-page layer above the preserved entry screen, with the global navigation and player kept available. Back returns to Profile or Search; selecting another main tab closes the notification page. The observed empty state uses a 64 dp centered header, a 16 dp inset/radius permission banner, 14/20 dp message text and a 52 × 32 dp permission switch. The independent original two-card raster illustration is displayed at 224 × 160 dp above a 28/38 dp empty headline and 16/24 dp subtitle. Dismissing the banner recenters the remaining content.

On Android API 33+ the prototype declares and requests POST_NOTIFICATIONS through the real native permission API. Browser permission is queried/requested through Notification. A dismissed or denied request never produces a granted state; errors have direct retry actions. Returning from device settings or browser focus refreshes permission state. No Suno push backend is connected and no system notifications are sent by this unit. Local saved songs provide disclosed activity entries with persisted Read state and actual audio-player navigation. Original populated notification states remain unobserved.

Banner dismissal and read markers use serialized storage commits; failed writes leave prior visible state intact and retry the failed update. Browser settings cannot be opened programmatically, so the Web route explicitly offers instructions. Unsupported platforms remain distinct from granted permission; iOS and older Android permission control are not accepted. The original Language settings entry opens Android's app-language settings, not an in-app language list; the observed system selector is a separate boundary, and its locale was not changed.

### Settings, appearance and model selection

Settings uses a full-page surface, a centered 18/24 dp title and 65 dp divided rows. The corrected candidate uses 16/22 dp row labels, a 16 dp horizontal inset and an 8 dp upward content adjustment after a matched-viewport comparison. The model chip opens an anchored 112 dp menu with 48 dp options. Free premium-model selection first opens the dedicated V6 promotion, with a 320 × 520 dp card, 20 dp corners and live 36/38 dp serif headline. The neon background is an original generated asset; headline, badge, close and upgrade actions are real interface elements.

Appearance has a 24/32 dp centered title in a 96 dp header, a 40 dp Theme heading region and 65 dp radio rows. Light, Dark and Use device settings persist only after storage succeeds, with a retry for failed writes. The source dark palette is #101012 for the main surface, #19191B for secondary surfaces, #28282A for dividers/controls and #F7F4EF for primary text. Settings, own Profile and Notifications currently adapt; other pages and modal variants remain incomplete. The dark profile cover has a full-height fade to keep identity text readable. The local Reduce motion preference remains available under About this prototype.

Edit Profile, My Downloads and My Subscription preserve the Settings return origin. Selected local paid plans unlock premium models, and model selection is shared with Create. The source offer's Upgrade destination has not been observed; the candidate links to the existing plans flow and remains provisional. Exact source icon silhouettes, font identity, asset appearance and motion timing are unverified; functional tests do not constitute visual acceptance.

The source Language action opens Android app-language settings. The candidate launches the real Android intent, with an explicit English locale declaration; German/Spanish declarations and interface translations remain missing; Web currently displays English. Source Report a problem and Support open external Typeform/help pages. The prototype has a disclosed local report editor/review/save/retry/copy flow and local help content, not those complete external websites. Local logout closes and persists the demo session, then reentry restores saved data. It does not touch the original Suno session. Original authentication parity and account closure/deletion remain open requirements; the source closure footer is not yet implemented.


### 2026-09-11 Main theme extension — private review, not full visual acceptance

Source theme01–03 in `../spec/theme-followup-20260911.json` establishes dark Search, Simple Create and empty Library. Main page/surface colors, inputs, inverse pills, navigation, song rows, mini-player, playlist forms/details and inherited audio/text-editor controls now follow the active theme. Explicit Light/Dark/System storage remains shared with Settings. Legacy creator/player/share/subscription/recording and other variants still require source review and adaptation; this is not complete appearance coverage.

Create retains animation and Reduce Motion handling. The first uniform dark overlay produced a flat gray result; source samples at (160,900)/(520,900)/(1000,900) were RGB(72,46,36)/(53,37,43)/(38,28,42), so dark mode now uses warm-to-purple native gradient layers plus a lower fade. This is a single-phase color approximation, not motion fidelity acceptance. Original light raster remains unchanged. Empty Library’s white rectangle exposed a previously baked background; a transparent-generation attempt returned an RGB checkerboard and was rejected. A separate generated dark-background illustration is selected; small background noise and illustration geometry still differ. No screenshot shell or source UI crop was used.

Initial matched pairs `../runs/main-theme-web/20260911T144635/pair-*.png` were opened. Search palette/spacing and Library title/cards broadly align; fonts, icons, source promotion/countdown, Create model border/header/banner, decorative assets and animation still differ. Main-theme tests preserve failures for Instrumental’s collapsed control and retained playlist route: test navigation was corrected to expand/return before asserting the original state, without dropping assertions. Full visual and platform gates remain incomplete.


### 2026-09-11 Create promotion and model selector — private evidence

`../spec/credit-offer-followup-20260911.json` records18 original references. Simple and Advanced credit-free banners both open the existing Annual/Pro plans page and return to the same mode. Source model dropdown contains descriptions, Pro badges and a checked mini row; v6/v6-wild open the dedicated v6 promotion, then Upgrade now opens plans. Original purchases and account data were not changed; Simple mode was restored after observation.

Measured header geometry: model92×40dp at top12/right16; mode center32dp; offer center74dp; dropdown top52/right16/width300/radius8, with source clickable row heights180/180/218px at2.75density. CreateHeader and CreateModelMenu now render these actual controls; the menu uses an anchored transparent modal, and radio/checked semantics fix a Web accessibility-state failure discovered by testing. Existing shared entitlements and v6 promotion handle selection, cancellation, upgrade and failure/retry.

The visibly labeled Demo countdown stores a24h local deadline. Valid/expired deadlines do not reset on reload, time updates at minute/expiry boundaries and foreground return; storage errors can retry and malformed local timer data has an explicit Reset demo offer action. Source campaign activation, expiry and paid visibility remain unobserved; local Free/paid visibility and expiry are declared simulation behavior, not claims about Suno service rules or benefits. Gradient border orientation varies in source captures; current static gradient is not motion acceptance.

Web credit-offer160606, subscription160606, main-theme160606 and navigation161217 passed actual journeys/storage/reload/real short-deadline transitions. Original web155543 failure is retained: button selection state omitted DOM aria attributes; changed to radio/checked rather than removing the assertion. Matched393×777 header/menu pairs actually opened. Top placement/menu geometry are close, with font, aura texture, icons, Demo label/state and motion differences still unaccepted. Native credit-offer161202 passed a separate model/offer/banner/Back subset using measured header entry coordinates; it does not waive the earlier dynamic Create full UI-tree idle failure. Native screenshot then exposed percentage SVG sizing shrinking outline to the button content box, leaving the arrow outside. Explicit92×40 sizing is being rebuilt for native visual recheck; prior interaction pass is not proof of final visual fidelity.

## Account closure — measured Android confirmation, local outcome

Reference: Suno Android 1.88.0 (410), private index `../spec/account-followup-20260911.json`. The Settings footer opens a centered confirmation dialog. Cancel, outside press and Android Back return to Settings; reopening clears the transient input. Focusing raises the card above the keyboard. Original Delete was never activated and the original `confirm_delete` token was never entered. Final server deletion and subsequent authentication are unobserved.

The measured card is 272 × 312 dp with 24 dp padding, 28 dp corners, 32 dp title line, 16/32 dp instruction text, a 64 dp input and 48 dp action row. Light card/input are #F7F4EF/#FFFFFF; dark are #2E2E33/#38383E; black scrim opacity is approximately 0.32. The 28 px serif title candidate matches the measured 135 px ink width at the 393 px comparison viewport; glyph height remains 22 px versus source 20 px. This is not full typography or motion acceptance. A separate small local-demo caption makes the deletion boundary visible.

The footer and live modal now lead to real deletion of the local demo's profile, songs, playlists, likes, drafts, attached persistent audio, offline playlists, local community records, reports and simulated entitlements. Exact token validation follows the displayed instruction; the source's response to an empty or invalid Delete press remains unobserved. Device appearance and OS permission choices are retained. Original selected media files and unrelated browser storage are retained.

A confirmed local deletion persists its in-progress state before unmounting music views. New or stale-account writes are refused, queued media work is drained, and saved data is removed before showing success. Errors remain on a recovery screen with Retry; restart resumes an interrupted confirmed deletion. Successful deletion remains closed across reload/restart; Continue opens a fresh local account. This local outcome is a service simulation and does not claim to remove any Suno account or online content.

Production Web checks cover real MP3 upload/reload/playback before deletion, confirmation/cancel/backdrop/Escape, initial storage failure, cache and record removal failures, retry, automatic restart recovery, unrelated data retention, fresh account state, stale-tab writes and rapid repeated confirmation. Native destructive verification is isolated from owner data; its specific release artifact and exact JavaScript relationship are recorded privately. Source post-deletion login, iOS, full-page visual matching, original fonts/icons and exact transition timing remain incomplete.

Android account dialog follow-up: matched source/native keyboard screenshots exposed unchanged card position and partially covered actions despite successful center taps. Android now uses height-based keyboard avoidance; focus uses the source pink underline. Full-button bounds against the actual IME frame are required in native verification; the earlier tap-only pass is insufficient.

Native playlist offline follow-up: bundled audio can resolve to an Android resource name, not an HTTP URL. Offline saving copies native local/resource/content inputs into the App-owned playlist directory and reserves network downloads for HTTP(S). The actual release failure and subsequent restart/playback/account-cleanup checks remain private verification evidence; this does not establish full playlist visual or platform acceptance.

### Voice entry and picker — measured candidate

The light Voice entry uses the 2026-09-11 source observations recorded privately in voice-followup-20260911.json: sheet top 136 px at density 2.75, surface #EDEAE4, recording control 100 dp with a 72 dp #C32906 core and #D7D4CF ring, side circles 56 dp in #E5E2DC, and a roughly 184 dp decorative artwork. Header and paragraph sizes are inferred at 18 dp; exact glyph metrics and motion remain unaccepted. The original decorative artwork is replaced by a newly generated raster asset, never a screen crop. Picker labels and empty states follow the observed Recents/Public/Liked pages. Nonempty sample review is a disclosed local workflow rather than a claim about unobserved source pages. Web interaction checks on export192632 include 320px bounds, real uploaded/recorded playback and persistence, plus empty/corrupt-file rejection. Selected sample use requires loaded, non-error audio with positive duration. Android content respects the actual bottom safe-area inset; the initial candidate placed controls 24dp too low. Handle inset, upload icon, picker type weight, unselected labels and divider spacing were corrected after paired review. Native full media checks, exact typography/artwork, Dark and motion remain open.

### Voice source selection and local clip preview

An uploaded Voice sample must last at least 15 seconds. This is distinct from ordinary Audio recording's six-second minimum. The Voice recording threshold follows that shared Voice sample constraint; direct original recording-threshold confirmation remains pending. Successful selection opens an optional name, an 80 dp waveform, start/end/selection drag controls, a selection hint, and equal Start over/Next buttons. Selection retains at least 15 seconds; canceling the next consent sheet preserves the name and range. Start over discards this selection only. The actual source consent was canceled; subsequent source creation/results remain unknown. The local consent text explicitly describes a demo and accepts no Suno terms; its downstream audio-sample review remains a disclosed local behavior, not complete Voice creation parity.

Waveform peaks are decoded from the actual file using Web Audio on Web and an Android MediaExtractor/MediaCodec module on Android; the Android decoder neither plays the file nor requests microphone access. Bundled tracks reuse their measured waveform samples. The decoder is registered through the project's Expo config plugin. Unsupported files produce a recoverable error. iOS decoding remains unimplemented/unverified. A selected range is stored as clip metadata with the owned audio draft; playback seeks to the start and stops at the selected end. This preserves the original audio file and does not claim to export a newly encoded trimmed file.

Source measurements and cancellation evidence are indexed privately in voice-trim-followup-20260911.json. Web201251 checks include a real12-second rejection, MP3 decode, naming, minimum-range clamp, consent cancel, persisted range/end-of-playback, real15-second MediaRecorder output and ordinary Audio six-second regression. These checks do not establish native or visual acceptance.

Matched 18-second fixture review exposed an extra range caption that shifted the editor, overly thin/dense bars and oversized action/icon glyphs. The caption is removed; slider accessibility values retain the selected times. Actual decoded peaks are aggregated to the displayed width, with 3 dp bars on a 6 dp period inferred from the source's 8 px bars and 16–17 px pitch at density 2.75. The playhead stays within the selected range, playback uses a 32 dp icon, the edit glyph is filled at 14 dp, and action text is 16/20 dp. Source waveform baseline remains approximately 5 px different in the first matched pair; asset background/grain, exact fonts and motion are not accepted. Android uploads inspect the copied file size rather than rejecting valid files using stale document-provider metadata.

### Public creator Voices — measured detail and local selection

Private source index: `../spec/creator-voice-followup-20260911.json`. The existing public creator has two Voice cards below an illustrated empty Songs section. Cards open a full detail sheet with title, creator link, local-like control, related songs and Use Voice. A real source failure recovered through Tap to retry. Use Voice opens Advanced with an independent Voice attachment and Trial badge; replacing or removing it preserves the existing form. Returning to Search restores the creator scroll position. Source Like, final Voice creation and nonempty associated songs were not activated/observed.

Measured detail geometry uses the 1080×2340 reference at density2.75: sheet top136px,100dp artwork slot,72×48dp like control,140×56dp CTA, and #EDEAE4 surface. The local font candidates are28/34dp title,18/24dp songs,12/16dp subtitle,18/22dp error and16/20dp retry. The creator header remains fixed while content scrolls. Local fixture names and generated artwork are deliberate substitutes; the opaque artwork background, glyph weights, gradients, tiny spacing and exact motion still differ. Same-viewport source/Web pairs were opened; full visual acceptance remains pending.

The prototype stores Voice selection independently of uploaded audio and associates its ID with a saved local example song. Likes use shared local profile state; associated songs use the actual global audio player. It explicitly states that the sample recording retains its original sound. This is not a cloned/AI-generated Voice model. Actual local artwork loading errors display the observed error/retry surface, adapting unavailable service behavior to real local media failure. Source post-consent creation and own Voice collection remain incomplete.

Web verification exposed two interaction issues: Escape during a sheet's entrance was ignored, and reusing a Voice-associated song left its parent detail covering Create. Sheets now register a Web-only Escape handler with top-modal ownership and single-keypress consumption; direct naming dialogs remain independently closable. Reuse dismisses the detail before exposing Create. Private checks preserve the failing runs and verify real navigation, nested/direct modal closing, local likes/selection/reload, associated audio playback, reuse and actual asset failure/retry. Native and full platform results are tracked separately.

### Search Recent — observed creator list and local history

The private source reference in `../spec/search-history-followup-20260911.json` shows a focused empty search with Recent, Clear, an existing creator row and a separate Remove control. Opening that row reaches its public profile. Source history was preserved; original Clear/Remove outcomes, sorting, service persistence limits, other record types and Dark/error states are still unobserved.

Measured geometry at density2.75 uses a64dp Search header followed by a64dp Recent header, a4dp row gap,72dp rows,56dp circular creator avatars and48dp removal targets. The title/caption candidates use14/18dp and12/16dp; Recent uses18/24dp. Header content is shifted4dp downward within its measured height after paired review. The right removal target is separate from the entry target and remains available with the keyboard open. The screenshot comparison is not full typography, icon, keyboard or animation acceptance.

Local selected creators, songs and playlists form a persistent recent list. Reopening a creator navigates to its real local profile; a recent song uses the shared audio player; a playlist opens its existing detail. Duplicate visits move the entry to the front. Removed Library entities are pruned from visible history. The song/playlist branches are declared local candidates until corresponding source evidence is available. Merely typing a query does not create a history record; original query-only history behavior remains unknown.

History is owned by the current local account and is included in account deletion. Each mutation reads and updates the latest stored list under the existing account lock, so a stale browser document cannot restore a cleared snapshot. Queued changes retry after a real write failure; reading failures retain the existing data and can retry. Invalid data is not silently overwritten: Clear local history explicitly resets only this record. All storage/error controls remain local prototype behavior, not claims about Suno's backend.


### Photo to Song — dedicated camera and editable prompt

Private source evidence: `../spec/photo-inspiration-followup-20260911.json`. The source has a dedicated full-screen camera entry, camera permission request and cancel state, independent Photos/Albums picker, selected-photo loading and a prompt with required inline text, cycling pink words and long-press editing. The original final Create was not activated. Source camera capture, complete option sets, post-generation screens, Dark and motion are still incomplete.

Measured light colors are #EDEAE4 surface, #E5E2DC camera card, #101012 ink and #DE1677 editable text. The camera permission button is56dp high, back/gallery controls48dp, and shutter120dp outer/88dp inner. The prompt uses a160dp square image. The current Web layout and text grouping remain candidates until matched native and Web comparison; short viewport camera geometry and typography have not passed fidelity review.

PhotoToSong uses actual Expo Camera/ImagePicker images. The camera is mounted only for its active route and is retained until asynchronous capture returns; all live media tracks are released on leaving preview. A clearly identified local prompt template replaces cloud photo analysis. Required place text, cycling choices, long-press custom editing, real file/permission/storage errors and local-example cancellation are interactive. The chosen existing recording is saved into the shared Library with the prompt and style; the photo remains in its separate draft, so carrying the photo into a saved song cover is still pending.

Photo files use their own persistent native directory/Web CacheStorage and an account-owned metadata key. Mutations use the account media/storage locks; refresh restores the actual file and prompt. Returning from the prompt explicitly discards the draft/file. Account deletion includes both photo metadata and files. Actual Web persistence, long-press, write-failure retry, sample-library transition, synthetic camera capture/release and account deletion checks passed on the recorded production build. Full Android/iOS, denied-permission and lifecycle coverage, visual fidelity and motion remain separate acceptance requirements.


Photo native follow-up found that the inline editor's Done button could sit below the clipped scroll viewport when the keyboard was visible. The save action now sits in the keyboard-aware footer; valid unsaved text may also be committed by Create before opening the local-example sheet. Actual Android testing must verify the repair; Web verification includes a revised title committed directly by Create and retained after cancellation/reload.

The denied-camera match supplies further measurements: source Back target is33px higher than the initial prototype, so header height changes88→64dp; intro top spacing becomes24dp. Badge uses10/12dp type,12dp icon and a measured32dp overall height. Main title18/22dp, subtitle12/14dp with4dp separation, permission text16/20dp and16dp horizontal button padding replace oversized candidates. The camera region gains24dp top separation and controls use168dp height to align card and shutter centers. These measured repairs do not establish visual acceptance; glyph family, target bounds, short screens, Dark and motion still require paired review.


Photo gallery/edit/restart verification on Android234502 confirmed that the fixed footer Done remains visible and saves text with the real keyboard; actual image and edited fields survive process restart. The next text repair keeps sentence periods grouped beside their interactive word and disables automatic capitalization to match the observed original lowercase keyboard. Production Web000611 passes actual long-press,393px/320px punctuation placement, direct Create field commit and image persistence. Native000647 behavior is being verified separately. These checks do not accept full typography, text layout, camera-source parity or motion.


Live photo drafts now refresh on storage notifications and AppState activation under the existing media lock, without overwriting a failed mutation retry. Image replacement/deletion closes an editor tied to the old image. Two independent Web documents verified edits, replacement, deletion and retry preserving concurrent changes. Android001802 verifies actual emulator CameraView capture, prompt editing, image/field restoration after process restart and explicit discard; camera service has no active clients after closing. Virtual still imagery differs from the earlier preview and is not accepted as camera visual fidelity. Native temporary-file cleanup and photo-to-song cover ownership remain incomplete.


Explicit photo discard removes and verifies only the dedicated durable draft-photo namespace, including orphan files whose metadata cannot be parsed. Failure retains the recovery action, and a queued discard retry checks the originally observed photo identity so it cannot delete a newer replacement. Production Web verifies corrupt-record reset, silent CacheStorage deletion refusal, metadata deletion failure, unrelated cache preservation and old-discard/new-photo races. Native003449 verifies a real selected file, exact own metadata corruption and an empty durable directory after UI reset/restart. Raw parser error wording and reduced-height camera card positioning remain unaccepted. Native temporary ImagePicker/Camera ownership and selection retry conflicts remain separate open defects.


Photo selection now keeps a first-attempt identity and a committed-save phase. An old failed selection refuses to replace a newer photo, while retries after a committed save finish cleanup without resetting subsequently edited fields. Native image inputs are released only for validated direct filenames in this app’s Camera/ImagePicker cache directories after durable save or known cancellation; other paths are retained. Unmount waits for active file work before attempting to release its known temporary sources. Actual Web checks cover precommit conflict, committed old-file cleanup failure plus another document edit, and closing during a delayed real cache copy. A durable recovery ledger for source deletion failures after unmount/process interruption is still missing and must not be treated as accepted.

Unreadable JSON now uses a photo-specific recovery message. The camera card is centered horizontally when the error area reduces its available height; source-native paired typography, normal camera fidelity, full error/motion and all platform acceptance remain separate.


### Photo camera switching — 2026-09-12

Private source references photocam02/06/07 show a Switch camera control only in the granted camera state. On the1080px/API34 source frame its actionable bounds are[860,1977][992,2109], with icon[882,1999][970,2087]; at device density2.75 this is a48dp target and32dp icon, centered about336.7dp. The candidate uses the existing sync icon in the measured right-hand control slot. Source observed only with emulated back camera and no front camera: pressing Switch retains the working preview. Two-camera hardware and exact icon shape/motion are not accepted.

The candidate now requests the opposite camera, disables shutter/switch while starting, rejects outdated camera callbacks, releases the prior keyed preview, and falls back once to its last working direction after an unavailable-camera error. Both requests failing retains the explicit local error/retry flow. Web012150 has actual synthetic-media switching/recovery checks012540 and photo text/lifecycle regression012351; native standalone012328 build and actual installed APK hash match. Native interaction and matched visual review remain pending at this note.


Web camera ownership follow-up: an actual delayed getUserMedia response after route close leaked one live track in013352/013858. PhotoCamera.web.tsx now owns stream acquisition and releases both current and late responses on unmount; capture uses actual video pixels. The native facade remains Expo CameraView. Matching .tsx platform extensions and exact staged input sets prevent the generic module from shadowing the Web adapter. Web014202 close/initial-close/switch/text014317 pass the original media-track, error, persistence and capture assertions. Source-specific dual-camera visual parity and native switching remain unverified.

### Local Voice collection and profile image validity — 2026-09-12

The observed creator Voice card geometry and Voice detail remain the basis for the local collection. New local-only continuation after the observed trim/consent step saves a named entity and its selected audio range, exposes it on the owner Profile, restores its independent selection after reload, and links example songs through the existing Voice detail. A small labelled local sample player exposes the retained recording. No model is trained and example music is unchanged. The original post-consent flow, populated owner collection, exact result controls and local sample-player placement remain unobserved candidates; this does not establish high-fidelity acceptance of those states. The original audio-attachment alternative remains available.

Profile image selection now actually decodes the selected data before displaying or accepting it. Corrupt bytes labelled image/png previously removed the visible avatar and enabled Save. Reproduction015557 failed; production020048 test020159 and020537 test020712 pass corrupt rejection, real valid image save/reload, picker cancellation and late return after editor close. Native crop/camera/source cleanup and storage-write failure remain separate gaps.

### Local example save lifecycle — 2026-09-12

The local service substitute now waits for a real durable song write before opening Library. Pending state shows an activity indicator, disables duplicate submission and sample changes, and permits cancellation. Failure keeps the form and selected recording available with an explicit retry. Cancellation before the account-storage lock is acquired prevents creation; late native persistence is followed by removal of only this task's newly created song. This does not reproduce or claim observed Suno model-generation progress: no original generation/credit request was submitted.

The existing example choice surface remains the visual basis for these local service states. Its content scrolls for reduced heights. Actual production021903 checks022022/022116 cover the real Web Locks wait, cancel/no delayed song, repeated click, quota failure/retry/single durable result and reload. The previous021714 failure showed a song rendered in Library despite the storage error. Full source creation-result visuals, native wait/cancel/error behavior, and interruption during native cleanup remain unverified.

Compact-sheet geometry follow-up: computed Web layout0227 showed the parent at y597/height180 while its content measured469px. The shared `flex:0` shorthand became `flex:0 1 0%`; replacing it with explicit zero grow, shrink1 and auto basis permits content height. The creation review now measures its scroll content and caps its visible height relative to the viewport.022305/022500 still failed the first-radio viewport assertion before the shared-parent repair. Final022751 passes022909 initial title/first recording viewport, complete retry button, pending cancellation, nested Escape and023058 compact Add-to-Song/profile image/Voice consent center-hit checks at393px and320px. Native layout is checked separately, not inferred from Web.

### Add to Song anchored menu — 2026-09-12

Paired inspection of original voice13-add-menu1080x2340 and native compact023334 showed a separate source mismatch: the original is an anchored popup, while the prototype used a bottom sheet. Original XML bounds[88,565][583,1137] at2.75 density give180x208dp,8dp vertical padding and48dp rows; text starts48dp from the menu edge. The candidate now measures the plus trigger, places a180x208dp popup beneath it, uses20dp radius,20dp icon slots with16dp Image/Video glyphs,16/24dp labels and the observed light surface#E0DEDA. It remeasures on viewport changes, clamps to available screen space, and keeps outside/Back/Escape dismissal and all four entry actions. Voice glyph, exact shadow/motion and original global card/header/background offsets remain unaccepted.

Final candidate Web023926 compact-controls024128 verifies popup dimensions/trigger alignment, entry hit testing and nested returns; stable-fade screenshots and desktop/actual media-entry checks are recorded separately. Source version remains Android1.88.0(410); no source consent, generation, purchase or social mutation is used.


Popup text measurement: source Voice label width111px versus candidate18dp width125px, and Advanced199px versus221px, show a16dp source size with24dp line box. Source Image/Video dark glyph bounds31x31px were oversized in the candidate at41x41/46x45; these use smaller16dp glyphs within the unchanged20dp slot, with the closed movie-play shape. Voice shape and exact pixel/shadow fidelity remain pending.


### Create Advanced options correction — 2026-09-12

Fresh original createmedia11/13/15/16 observations supersede the earlier assumption that Add to Song → Advanced switches creation mode. It opens a 232dp bottom sheet containing Vocal Gender and Song Title, leaving Simple behind it. Rows are 56dp high, with 16dp horizontal margin/gap, first row 64dp below the sheet top; the selected radio has a rounded filled background. Selecting Male then Female updates a removable vocal chip immediately. A selected radio has checked=true and clickable=false; no deselection is inferred. The header mode control remains distinct. Source image selection adds a thumbnail chip and enables Create, without opening Photo to Song; source video continuation and full attachment persistence remain under review.

CreateOptions now follows the observed entry, keeps mutually exclusive gender choice and title in the existing draft, and reopens from their chips. Web035316 on production035002 checks actual center-hit controls at393px/320px, mode preservation, title, gender replacement, repeat selection, reopen, reload, removal and Clear. Failure034658 exposed missing Web aria-checked; implementation was repaired and the same assertion passes. Existing native/menu checks that expected a mode switch are historical evidence of the old implementation, not source-faithful acceptance. Info text timing/visual is provisional; keyboard/platform and full visual gates remain pending.

Native042242 on standalone035317 verifies actual options entry, both radio roles, title bounds and system Back while restoring original mode/visible fields. Paired source/native images show source row RGB216/214/210 versus219/217/213, Male text28px too far right and title11px too far right. The candidate uses0A row tint,14dp option gap and16dp title glyph. Exact glyph widths differ by3–5px and the underlay state is not matched; no full visual acceptance. Source and user media are preserved; only the own source image/video fixtures and temporary gender choice were removed.


### Image and Video creation attachments — 2026-09-12

Original createmedia08/23 Simple screenshots show a selected image/video thumbnail inside a rounded attachment chip immediately after Add to Song. The32dp thumbnail has8dp corner radius, a14dp Image/Video label and a separate removal affordance. The original Video chip opens the system picker again; Cancel retains the selected video. The original Image09 click remained on the same captured surface, so direct image replacement is a candidate affordance pending further reference. Selected media changes the empty-prompt suggestion and enables Create. These branches do not open Photo to Song. Advanced-mode attachment placement and generated-song media association remain unobserved/unimplemented portions of the full scope.

The candidate now retains actual image/video bytes in a dedicated media-draft store and shows decoded thumbnails. Images are decoded before accepting the selection; video thumbnails come from actual frame0, using a paused/muted decoder without starting audio playback. Expo57-pinned expo-video57.0.3/expo-image57.0.4 provide the native thumbnail API. Web uses a decoded video element and an actual pixel thumbnail. Account cleanup includes the separate media namespace. Replacement persists and verifies the copy before replacing the previous record; cancellation before the commit retains the prior attachment. Invalid files, file-cache failure, metadata failure and conflicting documents have explicit recovery. Error recovery UI and persistence semantics are local prototype behavior, not claims about the original service.

Web media052319 passed actual-byte SHA256 retention, image/video thumbnail entry, reload, replacement cancellation, tab retention, corrupt decode rejection, file-cache failure/retry, cancellation under an actual delayed media lock, removal and320px controls. Recovery054128 on final053742 additionally passed metadata failure, write-then-error, two-document conflict/reselect and media namespace account-deletion failure/retry. Advanced options052916 regression passed before the isolated media-conflict catch repair. Native lifecycle and matched visual evidence remain separate gates.

Native media lifecycle findings: image055426 thumbnail and process restart were real; continuation060121 confirmed restoration and replacement cancellation but selected video was dropped without an error. The hook's foreground refresh could occupy its pending operation while the system picker returned its result. The picker now suspends that refresh until result handling completes, and initial rendering waits for media restoration. Final Web media/recovery061633 both pass on060902, including the same real storage and cancellation assertions; native video confirmation is recorded separately.

Final native063426 on standalone061409 passes true video thumbnail, force-stop restart, replacement cancellation, removal and restoration of original creation mode/visible fields. Original Video23 and final native04-video-restart were opened together at1080x2340 with the same3s fixture. The32dp thumbnail and image/video role are present, while chip positioning and global background/typography differ; candidate preserves the user's audio attachment so full surface state is not matched. Native exact sandbox bytes, write-failure/cancel at commit and abandoned failed-picker temporary file cleanup remain unverified.

### Local example input retention — 2026-09-12

Create and Photo to Song now save an independent copy of the selected media together with the full prompt, creation mode, instrumental flag and vocal gender. The local review explains that the chosen prerecorded audio and sample cover do not change. Remix restores these saved inputs and copies the retained media into a new draft; Reuse Styles and Lyrics remains limited to those fields. Library, Profile and full-player Remix use the same handler. Deleting a draft cannot remove a saved result's file, and deleting a result cannot remove the newly restored draft. Song deletion records any outstanding file cleanup durably and offers Retry in Profile. Account deletion includes these files in the existing owned-media namespace.

Library mutations now read the latest stored library inside the account storage lock and update the rendered state after the write. They no longer save a whole stale render snapshot. Independent documents refresh on storage/lifecycle events. Creation recognizes a write that completed before reporting an error; cancellation before completion removes only that submission. Share links keep the existing declared boundary: example title/styles/lyrics/audio reference are portable, while private creation inputs and local file ownership are not exported or accepted from a received link.

Production071335 Web creation-media071639 verifies actual image/video bytes, full prompt/gender retention, clear/reload/Remix, independent-copy deletion, receiver session, real sample playback, file deletion error/retry and metadata failure/retry. Photo-recovery071922 adds original Photo draft removal followed by result Remix, concurrent document saves and write-then-error recovery. Navigation/creation-failure/creation-wait/photo-text071456 regressions pass. These are local service behavior checks, not new observations of original post-generation UI. The native result path, exact result-file lifecycle, model/audio-input snapshot completeness, original result covers and motion, source-faithful Remix semantics, and remaining full-platform gates require separate evidence.

### Library song-search correction — 2026-09-12

Original e31/e33 and fresh libraryscope03–07 show a single rounded song-search field beside a Back target, with no category tabs, recommendations or visible no-results call to action in the observed empty-library states. Entry opens the software keyboard. System Back hides it without clearing the query; Clear removes the text while keeping an already closed keyboard closed; the header Back returns to Library. These source observations replace the provisional generic-search layout. Playlist search remains under Playlists; the global Search page is separate. Nonempty original library-search results and exact catalog membership still need evidence and have not been excluded from the full scope.

At1080x2340/density2.75, source Back target is[44,165,176,297], field[198,165,1036,297] and Clear[882,165,1014,297]. Each target is48dp high; horizontal inset16dp, Back/field gap8dp. The source header ends at363px. Relative to the prototype's136px native safe-area top, the header is82.5dp with10.5dp top padding. Source surface is#F7F4EF and field/back#EEEBE7. Native080106 matches the Back and field bounds exactly. The word “piano” has source dark-pixel bounds[300,216,404,255] and candidate[300,215,404,255]; this supports16dp/20dp candidate typography, without establishing whole-page visual acceptance. The comparison retained a smaller/angular back glyph and different line caps, so the header now uses existing licensed Lucide components with measured size/centering; post-change comparison is tracked separately.

LibrarySearch now owns the single-row header, autofocus, Clear, Escape and actual saved-song search/play/options. Main navigation hides while this native search keyboard is shown and returns when it is dismissed. The initial Web075020 failure showed that a bubbling Escape handler did not receive TextInput's event; capture-phase handling repairs page return while deferring to open modal dialogs. Source Clear does not reopen the closed native keyboard, so native Clear preserves that state. Web075648 passes393/320/1100px geometry and hit targets, query/clear/submit/back, working results/options/playback, tab retention and reload. Native080106 passes real keyboard, both Back levels, Clear and original draft preservation. The final vector-icon build must retain these checks; original nonempty rows, theme variants, global navigation glyphs and motion remain separate gaps.


Final Library search validation: Web080745 and native081122 pass on production080526/standalone080745 after the vector glyph change. Source and candidate native field/Back geometry remains exact. Magnify/Clear ink bounds now match, while Back and text differ by at most1px in recorded bounds; both native inputs remain focused, with different cursor blink phases. The whole-page pair still exposes a shared navigation gap: selected Library fill source#9F9D9B versus candidate#CCC9C5, and different global tab glyphs. This is retained for the shared-navigation pass rather than counted as full-page acceptance. All measured evidence and run receipts remain private.

### Shared main navigation measurement, 2026-09-12

The five tab centers use equal 72 dp slots distributed across the viewport. Standard touch targets are 72 × 56 dp; the centered Create target is 54 × 48 dp. Each selected visual pill remains 54 × 40 dp, independent of the larger target. Narrow Web layouts shrink the slots while preserving 48 dp minimum targets. Selection is exposed to accessibility on all five buttons. Tab actions retain creation fields and existing Library routes, dismiss the keyboard, and close the notification layer.

Source `libraryscope02/05`, `theme01/02/03`, and Hooks `libraryscope01` establish the flat selected fill: light #9F9D9B and dark #28282A. The dark inactive glyph color is #6A6A72, active #F7F4EF; light inactive #A3A3A3, active #101012. Hooks retains a dark navigation surface. These are measured rendered values, not an inferred overlay-opacity rule. Matching source crops and candidate runs are indexed privately in the navigation-style followup.

The existing licensed icon libraries supply a rounded-square/play composition, a round search vector, musical notes with a sparkle, and Library bars. Exact Hooks corner radii, note/beam silhouette, and Library bar endpoints remain visibly different from the source; those glyphs and press/motion fidelity are not accepted. The profile avatar uses an allowed original alternative image with matching 30 dp circular geometry. Current Web and native evidence must be read from the followup, not inferred from this specification.

Original navstyle03–06 additionally establishes Library-search → Profile → Library: the search route returns, the query is empty, autofocus opens the keyboard and hides navigation. Library song search now owns transient query state rather than sharing playlist search state. Earlier candidate checks expecting retained song-search text were superseded by this direct source evidence; their receipts remain private and unchanged. Creation draft and global Search retention are separate rules.


## Hooks inspiration and curated entry unit — 2026-09-12

Private source references hooks02–20 (Android 1.88.0/410) show a 64dp header, 150dp square inspiration cards with 12dp gaps and 16dp outer inset, followed by 176×48dp collection tiles at 8dp gaps. The feed starts at source y1037px; inspiration top y426px. Source base #101012, collection #19191B. Bedtime is a dedicated AUDIO TO SONG page: #EDEAE4 ground, #E5E2DC badge/back, #D7D4CF 100dp recording target with #C32906 72dp center; group at31.25% of content height, bottom inset24dp. Love opens PHOTO TO SONG with its own title/subtitle. Best of v6/Staff Picks/Made with Studio open playlists (Studio title Made in Suno Studio). Source Hooks notification empty state differs from the prior Search/Profile empty state and includes Create your first song.

Implemented source-grounded entry layout and local, functional downstream recording/playlist actions. Four original generated image assets replace photographic/cover roles; Studio art remains provisional. The timer is explicitly a local daily demo countdown; source deadline/expiry semantics and8second candidate border animation are not measured or accepted. Source hold recording was not performed: local review and attachment flow are candidate service behavior. Feed remains owned example audio with an unverified source control structure. Full visual/motion, Dark mode, all states and platform gates remain open. Compare settled assets; first render can precede image decoding.

Final Hooks source/Web and source/native comparison: recorder time16/20px, badge10/12px, title18/22px and subtitle14/16px; source font family/metrics still differ. Native measured inspiration targets [44,428][457,840]/[490,428][902,840] versus source y426–839, category y873–1005 versus872–1004. Recorder target [403,1933][678,2208] and Back [44,158][176,290] match source extents exactly. Four native sampled ground/outer/inner/back colors match source RGB. These measurements do not establish complete font, glyph or motion fidelity.


## Fullscreen Hooks video unit — 2026-09-12

Source feed03/06/18 establish that tapping the home video expands into a full-screen video surface with the bottom navigation retained. Source feed08 More contains Go to Full Song, Hide Creator, Not Interested and Report Inappropriate. Source feed10/11 +Hook opens Create a Hook, Select a song to get started, and Recents/Public/Liked tabs. The source account's song picker is empty: downstream nonempty creation is not measured or accepted. Source feed13 Hook comments have no song timestamp controls, and the source Hook count differs from the full song's like count. Source feed16 Remix is a keyboard-focused input sheet with Advanced and style chips, not a reuse-action menu. Back in feed17/18 dismissed this sheet and keyboard together. Source feed19 interior vertical swipe retained the same clip; no successful source paging transition is claimed.

Measured full-screen geometry at1080×2340/density2.75: bottom navigation y2120–2274; video container y0–2120; top Hook target [777,158][1036,290]; action targets48dp; bottom song card [44,1900][1036,2076], approximately361×64dp with16dp lower gap. Remix target84×48dp; side icons32dp. Source More uses #101012 sheet and #1C1C1F menu group with56dp rows. The local content footer varies in height with the disclosed example caption; transparent containers must not intercept the right-side share/menu controls.

The candidate uses two owned H264/AAC art-motion clips,22.2/25.8seconds, with actual HTML/Expo video playback, progress, pause, seek and lifecycle controls. These original example visuals replace source footage; they are not source screenshot controls. Home preview is muted, expanded playback is audible, and the full-song handoff transfers media ownership. Local Hook likes/comments are distinct from song likes/comments. Shares carry the specific example template/title/caption into an independent recipient session. Local Hook creation, report reasons and Remix results are disclosed local service candidates whose full original downstream states remain unobserved. Native and Web checks are recorded separately in the private followup; font/glyph/video composition, transition timing, native lifecycle and full visual acceptance remain open.

## Hooks text and Remix sheet geometry — 2026-09-12

The source Remix sheet in feed16 spans y857–1507 at1080×2340 and density2.75, giving236.36dp height. Its handle region is48.36dp; the header48dp; the space before40dp style pills20dp; the input follows after12dp and is56dp tall, with12dp below it. Source Advanced touch bounds [44,1166][337,1298] are106.55×48dp, while its visible pill occupies the40dp-high scroll band. Generate has a48dp touch target around its40dp gradient circle. The candidate uses real48dp Pressable wrappers,40dp visible pills and a236dp sheet. The local prerecorded-audio disclosure is inside the existing header region; it is additional local-service copy and is not claimed as source text.

Two same-word probes at deviceScaleFactor2.75 compare the licensed existing Roboto faces against unchanged source pixels. Advanced source white glyph bounds are150×24px; the12.5dp Medium candidate is150×26px. Ethereal source is119×24px, with12.25dp Medium the closest tested individual fit; the shared12.5dp style token remains an approximation. Pill icon12.5dp/gap6dp and effective16dp horizontal padding reproduce the source Advanced width within1dp in Web. Source input capitalization starts lowercase, so autoCapitalize is none. Its IME action still requires a fresh native observation. Web uses the same single outer input border and caret instead of an extra browser focus rectangle.

Full Hook creator text now uses16/20dp Medium; Follow12/16dp Medium; song title12/16dp Medium. Complete-pixel probes support these candidates. Initial creator/follow crops based solely on recorded hierarchy bounds cut off lower glyph pixels; those invalid measurements are retained and excluded. The unchanged screenshot was remeasured with complete, non-edge-touching text regions. These fits do not identify the original font or establish final visual acceptance. Long shared creator names truncate on one line inside the creator target, preserving the adjacent Follow button.

Web checks cover393/320/1100 widths, source-relative sheet/control geometry, real target-edge clicks, local disclosure, cancel/input retention, Advanced handoff and reload. Full video/social/local-result and long shared-footer behavior are verified in separate private receipts. Native final typography, keyboard single-Back behavior, background composition, exact glyphs, animations and platform acceptance remain open while the emulator is stopped. No source reference, assertion or acceptance threshold was replaced to mark these gaps complete.


## Hooks Remix：真实原生键盘与返回补验（2026-09-12）

参考仍为 feed16 / feed18，未替换原图或放宽视觉门槛。Android Remix 的输入焦点需要在弹层窗口可接受输入后请求 IME；现在原生桥接等待窗口焦点并在消息队列下一步请求键盘，关闭或卸载时移除待执行请求。此行为基于 Android 输入法连接条件，不用固定延时模拟键盘。Web 和 iOS 保留各自原有输入聚焦。

独立 APK143254：专项144839、完整 Hooks145102及冷启动145518实际通过自动弹出键盘、一次系统 Back 同时关闭键盘/Remix、恢复视频播放、主动收起键盘后打开示例确认、取消后保留提示词并可重新聚焦/返回；原 Create模式、输入及 Morning Light附件保留，没有保存测试作品。Web143040 的三种宽度几何/边缘点击和10组跨模块行为检查通过。结果不代表全局键盘、生命周期或整个模块全部完成。

同1080×2340视口的原版/原生真实键盘配对已查看：原版弹层顶857px、原生858px；两者键盘顶1507px；Advanced和创建按钮实际目标48dp。背景透出/模糊、字形、生成按钮图标/渐变、键盘动作键的原版右箭头与当前勾号仍有差异，动作语义还须安全核查。自有视频、曲名及本地示例说明造成的数据差异保留说明。完整视觉与动效仍未通过。

私有依据：`../spec/hooks-remix-focus-followup-20260912.json`、`../runs/remix-focus-validation/20260912T143208/source-native-remix.png`、同目录`geometry-observation.json`及`integrity.json`。内部诊断、测试和本节不得进入未经审查的成果出口。

### 后续：Go 动作键与新增原版差异

原版feed27稳定Remix的当前输入法记录明确为`imeActionName=GO`、`imeOptions=0x2000002`、`inputType=0x28001`，不是凭箭头外观推断Next。原版提交未执行。当前原型设置Go，并将提交接到与创建按钮相同的透明本地示例确认；`submitBehavior=submit`避免系统先blur导致关闭父弹层。Web150920/151350三种宽度以及APK151227/native151735的实际软键盘Go点击、取消提示词保留、一次返回、原有按钮路径和冷启动保留均通过。服务回调与原版真实结果仍未验证。

原版新绿色封面状态明确呈现随专辑色彩变化的模糊背景，当前纯色背景仍是显著缺口。标题含Remix符号的原版长文本边界286..794px、短文本406..675px，中心分别540/540.5px；封面独立左对齐。此前固定从封面后方排标题只接近长标题，短标题居中尚待修复。新配对`../runs/remix-go-validation/20260912T150920/source-native-go.png`已查看；键盘Go箭头已对应，整体视觉/动效仍未通过。新证据与源草稿恢复见同目录`source-evidence.json`及`../spec/hooks-remix-focus-followup-20260912.json`。


## Remix 封面背景与居中标题（2026-09-12 UTC）

本节接续前述纯色背景/左排标题缺口。稳定原版 feed27 提供亮绿色封面状态，feed16 提供暗色封面及长标题截断。标题与符号共同居中，封面独立位于左38dp、36dp方形；候选标题组两侧104dp限制，在393dp宽下最多185dp。该窄屏延伸规则仍属推断，原版仅393dp视口有依据。长标题原截图实际显示省略号；不能仅凭XML完整文本断言全字显示。

以原图缩略封面仅作私有背景模型拟合：cover裁切、约24px/2.75=8.73dp模糊、#1C1C1F约74.8%遮色，稳定无控件区域平均绝对误差1.43/255。该拟合有缩略图与滤镜算法的不确定性，不证明原版实现。产品采用自有完整封面、9dp模糊与#1C1C1FBF遮层，不包含参考截图裁片。选中标签白4%、边框白10%、占位文字白30%为同一参考的合成拟合；取消标签透明。Android API34与Web在缩放后的独立图片容器上模糊，控件位于其上方且装饰层不接收触摸；其他平台后备实现仍未验收。

Web三宽度/两封面/短标题与200字长标题检查通过；自有封面切换的空白背景像素确实变化，长标题居中省略且不碰封面。源/Web与源/原生配对已检查；原生与Web同一自有封面的五块无控件区域MAE约0.49–0.65/255，仅是背景跨端一致性证据。精确符号轮廓、创建按钮颗粒渐变、整体字体/动效仍未验收。详细私有证据见`../spec/hooks-remix-backdrop-followup-20260912.json`。

### Advanced 音频保存时序

实际回归发现进入Advanced后立即刷新可能丢失附件：文字草稿与音频写入不是同时完成。音频现在先持久化再转入Advanced；失败保留Remix输入并提示重试。等待中禁用冲突的Advanced/创建操作，关闭后阻止尚未提交的音频任务及迟到导航。Web真实Storage写入异常、实际锁等待、取消、重试及立即刷新已分别验证。该局部修复不代表跨媒体/音频/文字的完整事务或全部原生错误恢复已通过，仍保留逐项审计。


## Remix 三份草稿共同提交与恢复（2026-09-12 UTC）

此前`reuseTrack`先删除/替换图片视频，再写音频；实际音频写入失败会丢失原图片。现在先准备并校验独立媒体副本，保留原图片/上传音频文件，通过同一账号存储锁保存文字、音频和图片视频三份记录。提交前写入包含前后状态的私有本地恢复记录；每一步检查取消状态，失败恢复原记录。清除恢复记录才表示共同提交完成，此后才清理旧文件、更新界面和返回创作页。

启动时在加载创作组件前恢复被中断的提交；三份草稿的读写也检查待恢复记录。若恢复本身暂时失败，保留记录和两套文件，避免猜测后清理；稍后可再次恢复。每份当前状态还要与开始时观察一致，避免覆盖另一窗口已经修改的草稿。文字/音频采用已提交快照，避免收到事务结果后又异步重复写入旧状态。服务仍为本地示例，没有调用原版生成或社交后端。

生产Web已验证六种实际Storage写入前/后故障：原文字、实际上传MP3、图片的记录和SHA-256全部保留；刷新后真实播放，成功重试再清理旧文件。另在实际写入新文字和音频后暂停、仅终止独立测试浏览器自己的renderer进程，新页面恢复原三份记录和两份文件并播放音频。该检查不同于预填一份模拟恢复记录。普通关闭暂停页面会先恢复执行并完成提交，早期该测试尝试被保留为工具行为诊断，不能当作中断恢复失败或通过。

内部证据索引在`../spec/remix-transaction-followup-20260912.json`。原生Advanced与独立重启另行记录；平台实际故障注入并未全部完成。提交成功后的旧附件清理失败会保留已保存的新草稿并显示提示，但专用持久清理队列与重试仍待完善；不把此路径计为完整错误恢复。整体视觉、动效、原版未覆盖分支及全量交付门槛保持未完成。


## 旧附件清理失败的持久恢复（2026-09-12 UTC）

接续上节：成功保存新草稿后，旧图片/上传音频的清理所有权现在与文字、音频、媒体记录一同写入持久事务日志。清理失败保留新草稿，并提供真实 Retry cleanup 控件；重启后重新尝试，正在清理时禁用重复提交。若待清理文件已再次成为当前选中附件，则保护文件并移除过期清理任务。删除成功但确认记录写入失败时，保留队列供幂等重试。旧版没有 cleanup 扩展的事务记录仍可恢复。

Web 真实 MP3/图片文件删除异常、刷新、锁等待、防重复、部分删除及确认写入失败后重试通过；实际本地账号删除可清除未完成队列及对应文件，新账号不恢复旧内容。三记录写前/写后六种故障和独立浏览器 renderer 中断恢复仍通过。内部证据见 `../spec/attachment-cleanup-followup-20260912.json`。这些证据限于所列 Web 和模块检查，不能替代原生真实文件异常路径、源页面视觉或全量验收。


## 评论菜单、可选时间戳与本地举报（2026-09-12 UTC）

comment06/07 原版列表证明时间戳可缺省，他人评论 More Options 仅打开 Report 锚定菜单。弹层原边界728,438–1036,614px，在2.75density下为112×64dp；上下8dp内边距，中间48dp操作行，背景RGB28/28/31，24dp旗帜与16dp文字。原More目标940,342–1072,474px为48×48dp，不能按可见图标尺寸缩小。源菜单Report未执行，因此后续不能冒充原版提交结果。

本地菜单已按这些依据接入，他人评论不再显示候选Copy弹层；本人评论Copy/Delete仍是待补原版依据的既有候选。举报采用明确的本地确认和持久记录，失败留在确认页供重试，等待存储锁时取消不提交，重复相同评论只保留一条，账号删除一并清理。无时间戳记录不显示虚构00:00；已有时间戳仍跳转真实播放位置。原生初测发现48dp绝对定位子按钮仍被24×32dp父容器裁切，已将父容器也改为48dp并保留原视觉中心；最终验证在内部followup继续记录，不能以Web尺寸通过代替Android触区。

原版reply09/10还显示“Reply to 作者＋被回复内容摘要”，Back先隐藏键盘并保留回复对象。当前原型回复预览、占位文案及键盘动作尚需校正。来源和实际回执见 `../spec/comments-menu-followup-20260912.json`；完整评论视觉/交互、原生存储故障及整个Goal仍未完成。


评论菜单最终补验：Android175027/native175416通过48dp首行边缘点击，Report行宽112dp/高48dp，行左上与原版728/460px相差不超过2px舍入；一次Back、确认/取消及原草稿保留通过。173622的24×32dp父级裁切和174603的48×40dp滚动区裁切原失败均保留。最终viewport上扩5dp、内容padding补偿5dp保持正文位置，首行按钮上沿不再被裁切。Web175029原评论和新增举报/混合时间戳检查通过；原生举报提交和实际存储失败没有据此记为通过。


### Reply author and quoted parent (2026-09-12)

Source comment09 measures a48dp reply row,44×48dp Close target and4dp author/excerpt gap. Main text is#F7F4EF; parent text#C2C2C1. The composer placeholder reads “Reply to comment…”. Actual source EditorInfo is multiline with IME_ACTION_DONE6; tapping Done with an empty draft retains keyboard, focus and reply target. Nonempty source submission was not invoked. The prototype uses the existing disclosed local service for nonempty Done, while physical Web Enter inserts a newline.

The new preview preserves draft and target across close/reload, and cancel only removes the target. Long-author65% width cap is a local responsive adaptation, not a measured original long-author rule. Source/native paired screenshot shows the local preview about14dp too high because the local disclosure occupies additional vertical space; composer target/visible height and complete typography/motion remain unaccepted. Web182550 passed393/320/1100 long author/multiline/edge-cancel and persistence; native verification is recorded separately in `../spec/comments-reply-followup-20260912.json`.


### Create tab playback variant (2026-09-12)

Source compact-tab01–07 shows the selected Create tab replaced by a compact album-art/full-player control and separate transport. Search, Library and Profile show the ordinary full-width mini-player above navigation. Returning to Create restores the compact variant, and system Back from its full player returns to Create without changing the paused state or editable draft.

Measured at2.75 density:88×40dp rounded background,32dp circular artwork,40×48dp open target and48×48dp transport target,24dp transport icon; other tab targets shrink from72dp to68dp. Hit targets begin4dp left of the background; a96dp wrapper with horizontal negative4dp margins contains those hit targets without clipping. The artwork remains4dp right of its target center. Source exact palette/outline, Dark and motion still need complete matching. Web three-width actual playback and five-tab/two-theme baseline passed on the first candidate; subsequent offset correction requires its own Web/native verification in `../spec/compact-player-tab-followup-20260912.json`.


### Local comment commit acknowledgement (2026-09-12)

A real rejected storage write previously cleared the reply and added a comment before persistence succeeded (private fault185345). Comment mutations now read and update the current stored record inside the shared account lock. Immediate draft and reply edits remain visible as revisioned local overlays; a failed autosave keeps those edits available. Posting waits for durable confirmation before changing the comment list or clearing the matching composer. Edits in another document are retained when they differ from the submitted draft.

The composer and reply controls are disabled during a pending post, with a local saving status. Closing cancels a post still waiting for the lock; a storage write already started is reconciled by its stable attempt ID. A rejected acknowledgement is read back; if that read also fails, the same-ID retry cannot duplicate the stored comment. Successful deletion is acknowledged before closing its confirmation, and errors remain visible there. These are local-service recovery behaviors, not observed original Suno submit/error screens. Full original visual/animation and native injected storage failure acceptance remain separate. Private followup: `../spec/comment-commit-followup-20260912.json`.


### Cancelling a queued local comment deletion (2026-09-12)

Fault194238 confirmed that Cancel closed a pending deletion confirmation but did not invalidate its queued storage mutation. Each confirmation now owns an active/pending token. Cancel or closing Comments invalidates that operation, and the token is checked inside the account lock before deletion. An older operation cannot close a newer confirmation. Pending confirmation displays “Deleting…” with its submit control disabled; Cancel remains available while the operation waits. A write that has already started is not claimed to be rolled back.

Web194922 exposed a second bug: Escape cancelled deletion but also dismissed the parent comment sheet. AudioConfirm now registers its own root in the existing Escape ownership stack, consuming that keydown/keyup pair at the topmost dialog while keeping native Modal Back handling. The original failures remain in the private deletion followup. Original own-comment deletion screens and native injected lock waits are not source/visual acceptance.


### Comment composer target and visible background (2026-09-12)

Source comment09/10 and empty-Done observation measure a48dp EditText target with a44dp visible input fill and44dp avatar centered inside it. The reply row ends10dp before the input target; the target ends17dp before the keyboard/content bottom. The full source clock has18dp right inset; EditText ends4dp before the visible pill's right edge. These distinctions resolve the prior14dp-high reply row, rather than shrinking the44×48dp reply-cancel target. Private measured coordinates/hashes: `../runs/comment-composer-validation/20260912T202214/source-measurements.json`.

The local17dp footer retains the explicit local-comment notice at10dp type/12dp line height with2.5dp vertical margins. The input owns its padded touch region; the pointer-transparent clock does not intercept focus. Nonempty Post keeps a44×48dp target, with separate text padding; long drafts retain the existing120dp maximum. These long-draft and Post details are local responsive behavior, not measured original nonempty submission.

Initial Web dimensions passed but screenshot review exposed the absolute background painting over textarea glyphs. Positioning the actual input restores correct paint order; the initial visual failure is retained. Final Web202344 checks320/393/1100 geometry, actual text visibility, padded-edge focus, multiline input/cap, shared timestamp-free Hook composer, and existing reply/draft persistence. Native actual geometry/IME acceptance is recorded separately in the composer followup. Complete typography, long-native multiline cropping, animation and full comments fidelity remain open.


Native202512 matched the with-IME target coordinates exactly, but retained the old Modal drawing under the system navigation bar after Back: footer was66px too low and the gesture handle covered the disclosure. The Comments footer now reserves the actual Android bottom safe inset only while the keyboard is hidden. No fixed device-specific bottom distance or changes to other sheets were introduced. Original with/without-IME assertions remain unchanged for the final rebuild.


### Acknowledged local profile and setup saves (2026-09-12)

Private actual-write faults showed Profile Save returning to the main page with an uncommitted name, and setup Next leaving its name step before the name/progress were stored. Local profile mutations now read/merge/validate/write under the existing account lock and return explicit success. The UI displays the last committed profile; editor fields and setup photo/name remain local drafts until acknowledgement. Save and Next show Saving… and prevent duplicate submissions while their inputs are read-only. Failure stays in the same editor/step with its draft and inline retry message.

The editor freezes its initial editing baseline and submits only fields and individual social links actually changed, preserving independent edits to other fields. Follow/Voice-like/recommendation changes compute their list updates from the latest stored profile. Cancel or closing a modal invalidates a save still waiting for the account lock. The existing Web modal Escape stack now includes both full profile modals, retaining nested sheet ownership. A storage write already begun is not claimed to roll back.

The source-supported setup name/photo presentation remains; after the photo step, the existing clearly described local profile editor is still a candidate continuation, not original steps3/4. Actual source nonempty submission/error screens and full visual fidelity remain unverified. Web real-write failure, queue cancellation, independent-document merge, actual image decode/selection, reload and local account closure/fresh identity are recorded in `../spec/profile-save-followup-20260912.json`. Native keyboard/name/restart scope is recorded separately and does not establish native fault injection or actual crop/camera acceptance.


### Profile image decoding on Android (2026-09-12)

Actual native gallery/crop validation exposed rejection of valid embedded images by the pinned RN 0.86.3 encoded image-size pipeline. Profile editor and setup now share a decoder: Android loads the embedded bytes through the existing expo-image module and releases the decoded reference after verifying dimensions; Web and iOS retain their existing image-size path. Recognized JPEG/PNG/GIF headers determine the embedded MIME type, since Android picker base64 output may differ from the selected source file format. The existing size limit, actual decode rejection, cancellation guards and acknowledged profile saves remain required.

Private evidence and platform limits are indexed in `../spec/profile-photo-followup-20260912.json`. Original profile crop/permission flows and setup steps3/4 remain unobserved; this functional repair does not establish source fidelity or iOS acceptance.


### Profile external picker recovery on Android (2026-09-12)

The Android editor and photo setup persist the original editing baseline, unsaved fields, target image and originating Profile/Settings route before opening an external picker. Startup restores this session and consumes a pending native picker result once, validating actual image bytes before retaining it. Recovery failures offer explicit retry or discard; cancellation clears only the matching session. Saving a recovered editor commits profile changes and clears its pending session in the same native AsyncStorage SQLite transaction. Account removal includes the recovery record.

A natural one-time camera permission revocation killed the isolated native process; actual system Back then restored the editor with the exact unsaved name and bio. Cancelling retained the original committed profile and cleared the pending session, verified by read-only inspection. Settings waits for its parent native Modal onShow before mounting a recovered editor, fixing the verified hidden-editor return. An actual SQLite abort on session clearance rolled back the profile update, retaining the editor/draft/error and unchanged committed profile hash. After fault removal and restart, retry saved and returned to Settings with the pending record cleared. Successful camera-image return checks remain pending in `../spec/profile-picker-recovery-followup-20260912.json`. This lifecycle repair does not establish original setup steps3/4, full visual fidelity, or iOS validation.


### Pending camera image compatibility (candidate, 2026-09-12)

The first recovery implementation restored setup step2 after natural permission process death, but actual Shutter/Done returned no image and left Next disabled. The pinned Android activity-result registry only persisted on host destruction; the image picker pending-result path also bypassed requested editing. A version- and full-source-hash-guarded Android config plugin now persists request state before external launch and after result delivery, and resumes the requested crop for a recovered camera/library image. Results already returned by the crop activity are not cropped again.

This native compatibility change has compiled, but its actual natural-death Shutter/Done retest still returned no image/crop. Native result delivery diagnosis remains open. It must not be described as completed camera support. The Web export is byte-identical to the preceding validated export; current native evidence and failures remain in `../spec/profile-picker-recovery-followup-20260912.json`.


### Android result initialization and comment keyboard (2026-09-13)

The previous image-picker compatibility artifact consumed a prebuilt ImagePicker AAR, so only the core registry patch was compiled. Android autolinking now builds the exact Expo/core/ImagePicker packages from source. A private diagnostic APK with mandatory compiled markers confirmed that RESULT_OK was forwarded while the React context existed but before AppContext modules were registered; the later pending getter returned null. The candidate wrapper now awaits host initialization off the UI thread and outside the lifecycle mutex before forwarding, allowing onResume to initialize normally. Actual camera-return acceptance remains pending; see the dedicated recovery followup.

The comment editor explicitly uses no automatic capitalization, autocorrect and multiline input with Done. Actual isolated Android editor flags now match source inputType0x28001, initialCapsMode0 and Done6; the native keyboard image was inspected. Web input hints and lowercase/newline draft retention passed separately. These scoped checks do not establish full comment typography, motion or native multiline geometry.


The readiness repair now passes actual isolated camera recovery: a diagnostic avatar path resumes1:1 crop and persists exact1392x1392 JPEG bytes; a non-diagnostic production-logic cover path resumes3:2 crop and persists1392x928 JPEG while retaining the existing avatar. Both drafts survive independent restarts before confirmation, and matching recovery records clear only after Save/Next. Ordinary camera/gallery cancellation preserves the original profile. DocumentPicker Back returns its originating Audio sheet, then another Back returns the unchanged Create form. Main APK001506 was installed and actual before/after Advanced inputs, Morning Light and paused playback match. Long external picker durations beyond the pinned five-minute persistence expiry and other lifecycle/source/iOS states remain unverified. Private receipts are in the profile-picker-recovery followup; this is scoped functional verification, not full profile or platform fidelity acceptance.
