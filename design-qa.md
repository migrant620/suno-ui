# Suno creation prototype design QA

Internal validation only; exclude this file from every outcome export.

## Evidence and normalization

Reference: `../references/20260910T095409995702Z-c06-style-save-cancel-888ae0e4/screen.png` (Suno Android 1.88.0).
Implementation: `../runs/editor-visual-20260910/05-icon-accessibility-fixed-web.png`.
State: Styles editor, “Bright piano”, no keyboard, Undo enabled, Redo disabled.
Source 1080×2340; native window data confirms status/cutout 136 px and navigation 66 px. Crop only these platform bars, then resize content 1080×2138 to 393×777. Web viewport/screenshot 393×777, DPR 1. The earlier guessed 88 px status crop is not acceptance evidence.

Full comparison: `../runs/editor-visual-20260910/05-icon-accessibility-fixed-pair.png` (reference left, implementation right). Focused evidence: corresponding `-heading.png` and `-toolbar.png`. Both source and implementation, including combined inputs, were opened and reviewed.

## Findings

- P2, toolbar icons: replaced undo/redo with Lucide Undo2/Redo2, bookshelf with Lucide Library, and trash with Ionicons trash after comparing library candidates. Silhouettes are closer; stroke/size and icon centers still need final measured adjustment. No handcrafted paths.
- P1, creation aura and accent: the prototype uses flat static gradients while the source has moving grainy color fields. The Done accent visibly differs. Still blocks fidelity acceptance.
- P2, footer geometry: icon centers and Done button alignment differ by several logical pixels; measure and correct after icons are replaced.
- P2, remaining flows: full form, dialogs, keyboard/insets on Android and other modules have not passed paired visual QA. Functional representative tests cannot establish global fidelity.

## Required surfaces

Typography: body text, content and line count agree at this state; regular 28 heading is visibly closer than the previous medium weight. Native paired diagnostic 06 confirms heading ink 10 physical pixels narrower and 4 px higher, body 4 px lower; the font/metrics are not approved. A visible native caret is an additional state difference, so 06 is not an acceptance baseline.
Layout: removing Web's duplicate 49-unit top inset and 24-unit bottom inset aligns the sheet, handle, heading and footer vertically. Toolbar centers still need adjustment.
Colors: measured opaque surface agrees; animated accent does not.
Assets: no reference screenshots are used as runtime controls; current icon choices and background remain actionable mismatches.
Copy: editor heading/input match; no replacement marketing copy. Example enhancement disclosure is an intentional service-boundary addition and is not part of this comparison state.

## Interaction and error evidence

Web representative forms/styles/Advanced shortcuts passed in the timestamped `../runs/representative-web-20260910/` receipt. Both browser page errors and console errors were collected with no errors in that run. Android has started in official Expo Go, but no full native flow acceptance is claimed. Desktop Electron DevTools launch failed separately under root; it is not a browser page error.

## Iteration history

02-insets-before: measured viewport comparison showed a 49-unit sheet displacement, footer inset duplication and excessive heading weight.
03-insets-font-fixed: updated platform insets and regular heading, captured again; combined comparison proves improved alignment. Icon and accent issues remain. Initial stale-bundle failures remain in run history.
04/05-icons: changed to selected library icons, corrected native accessibility props leaking onto Web SVG, and captured again. Current representative Web tests collect both console/page errors and pass. Explicit icon subpath imports reduced the export bundle from 3.9 MB to 2 MB. Android editor now opens with keyboard, but its complete flow is still under test.

## Audio iteration — 2026-09-10

Source b42–b54 and d01–d09 followup; d03 capture failed and is excluded. Reviewed combined geometry diagnostic `../runs/audio-fixture/picker-geometry-pair.png`: matching viewport, but different search/content and lawful example assets, so this is not a same-state pixel acceptance pair. Source row pitch 198px (72dp), cover154px (56dp), text x242px (88dp). Fixed overcropped thumbnail with explicit image size; corrected title offset and row pitch. Prototype title font/weight, footer and complete populated lists remain unaccepted.

Actual Expo audio playback, seek, Extend region and remove flows were tested on Web and Android. Later source followup exposed omitted preview/Continue and incorrect Simple navigation despite those narrow tests passing. Added preview/Continue, Simple inline audio chip and a shared player that retains playback position across modes. Latest Web receipts `audio-web/20260910T134642` and `simple-audio-web/20260910T134958` pass. Android older pass `audio-native/20260910T131603` predates these changes; current retest is pending after stale cached native code was detected. No global acceptance follows from those checks.

Source music/cover are not shipped. Morning Light is an original local instrumental example, with an original generated cover. Preview labels disclose the example boundary. Its audio waveform is computed from PCM RMS, not a screenshot or invented amplitude pattern. User-uploaded audio has a seek surface but full waveform extraction/persistence remains pending. Production asset metadata and licensing review are still required.

## Implementation checklist

Replace mismatched icons; measure footer centers; verify native keyboard and return behavior; replace static background/accents; compare each remaining state and execute full module tests.

final result: blocked

The blockers are unresolved implementation differences, not missing user input. Continue working.


## Library resume comparison — 2026-09-11

Source home: `../references/20260910T140649122193Z-e01-library-entry-12111fb7/screen.png`; grid: `../references/20260910T142832750921Z-e07-playlists-page-48d3c5ff/screen.png`. Web screenshots are `../runs/library-web/20260911T012216/01-home.png` and `02-grid.png`; later comparisons use `../runs/library-web/20260911T013346/`. Source crop removes only 136px status/cutout and 66px navigation; 1080×2138 content scales to the measured 393×777 web viewport. Each full comparison pairs source left and implementation right. Different lawful demo images and avatar are intentional substitutions; their styling still requires fidelity review.

- Before: `../runs/library-visual/20260911/home-pair.png` and `grid-pair.png` opened together. P2 inactive filters and header controls too faint; original RGB interior measurements #EDEAE6 and #EEEBE7 applied. P2 thumbs-up wrist silhouette wrong; reviewed five installed icon-font candidates in `thumb-candidates.png`, rejected Ionicons after rendered inspection, selected MaterialIcons thumb-up-alt. P1 overly bright sharp cover texture replaced by generated v2 candidate using the actual original reference as input.
- After: `home-after-pair.png`, `grid-after-pair.png` and `grid-material-pair.png` in the same directory opened and compared. Fill now matches the recorded opaque colors. MaterialIcons silhouette is closer; subsequent size correction awaits a new capture. New texture has better green intensity but overly sharp mottled boundaries: P2 remains. Header/body glyph widths, playlist-card illustration, empty illustration and navigation icon silhouettes remain P2 differences. No global pass.
- Functional: native library representative flow passed `../runs/library-native/20260911T012847/result.json` after removing the Expo Go Tools button overlay. Its prematurely captured `03-detail.png` is a list transition, not a valid detail reference; the script now waits for Playlist Actions before future detail capture. Web library and actual cover selection/persistence checks passed, but full native persistence remains untested.
- Newly observed source behavior: Add Songs remains open after per-row add, updates its title to 1 Song Added/2 Songs Added, and the populated playlist persists after Back. The old single-choice Continue picker is not accepted for playlists. Followup and implementation are ongoing.

final result: blocked


## Playlist preview behavior — 2026-09-11

Source f22/f23 and rendered screenshots were opened. First paired diagnostics had different session counts; they are not an acceptance baseline. New `../runs/library-visual/20260911/picker-matched-preview-pair.png` pairs the same zero-added, first-row-preview state at 393×777. Original Staff Picks and two lawful local sample tracks differ in content and list density; no full pixel score is claimed.

The repeated row tap now actually pauses audio, removes the mini-player and resets the row highlight. Web membership/preview checks passed `../runs/library-web/20260911T021740/result.json`; shared creation audio regressions passed `../runs/audio-web/20260911T022008/result.json`. The initial test incorrectly expected aria-selected on a button; the corrected assertion checks the actual title highlight, missing footer and paused HTML audio. No playback or membership assertion was removed. The failed receipt is retained. Expanded Android multiple-add/remove/reopen/deduplicate checks passed `../runs/library-native/20260911T021922/result.json`; native preview itself remains pending.

The paired visual still has P2 title weight/baseline, search icon size, row plus size and waveform icon differences. The preview footer is raised by the local-example disclosure and adds a playback-time label absent in the original. The disclosure is required by the service boundary; its placement should be refined alongside the footer rather than silently removed. The green thumbnail/empty illustration and populated detail issues noted above remain open.

final result: blocked


## Populated playlist implementation in progress

The source g09 detail, g11 sort, g14/g15 search and g17 share captures were opened, as were the g22 song-options current screenshot and the ANR diagnostic. New PlaylistDetails/SongRow and share/offline behavior are implemented candidates; current typecheck and the prior representative Library checks pass (`library-web/20260911T032848`). New sorting, shared-link decoding, actual offline replay and native regressions still need explicit checks. Mini-player expansion is unfinished; do not treat it as a completed song detail. SongActions lacks the observed Dislike/Report branches and remains an incomplete menu. Source g26/g27 full-player observations were rejected because of an ANR system dialog; diagnostic screenshots must not be substituted for an unobstructed reference.

final result: blocked

### 2026-09-11播放器进行中复核

final result: blocked

- h05原版暂停播放器与Web042737匹配393×777 app视口并并排查看，配对在私有runs/player-observation-20260911/player-background-fixed-pair.png。示例曲目/作者/音频时长不同，不作全屏像素通过。
- 修复P1：Mini Open错误切换播放，现为真实播放器；背景容器高度；动画未结束时截图。Web实际seek、close/reopen、切歌等已通过042737。
- 待修P1：动作行评论/Add-to-Playlist、作者Follow及原版已发现下游分支未闭环；Native完整播放器未验；独立APK未构建；全局未通过。
- 待修P2：transport对比约低11dp，图标大小差异、信息卡布局与示例数据差异待拆开评估。不得以Web行为通过代替视觉或Android验收。

### 2026-09-11 standalone keyboard and player follow-up

The standalone playlist creation footer was hidden by the keyboard (`../runs/standalone-native/20260911T065402/failure.png`, opened). Android height avoidance keeps the submission button above the keyboard; the fixed screenshot `../runs/standalone-library-native/20260911T065952/01-create-keyboard.png` was opened and actual creation succeeded without dismissing the keyboard. The same run passed two-song membership, real full-player play/pause, repeat cycling and persistent Add-to-Playlist changes, then deleted its own playlist. `03-full-player.png` was opened. This resolves the previously untested representative native player behavior; missing player branches and overall visual differences remain open.

The current production Web also passed the Library regression and explicit unavailable-audio recovery after correcting the missing favicon resource. Native release builds now succeed and run independently. Full native audio persistence, recording, other main modules and iOS remain unverified.

final result: blocked


### 2026-09-11 Main navigation and recording repair

The reported disabled Hooks/Search/Profile controls were real missing implementation, outside the old representative tests. All five tabs now open functional screens and share local song/like/playlist data. Current production Web passed the navigation, supplemental search/remix and recording checks indexed in private spec/navigation-followup-20260911.json. Recording uses real MediaRecorder/HTML audio/cache with a synthetic input stream; physical microphone and native recording quality remain unverified.

Reviewed rendered mobile Hooks, Search, Profile, shared custom-song playlist and recording-preview screenshots, plus the 1280×900 centered desktop adaptation. No screenshot controls are used. Original home has a fresh reviewed reference; Search/Profile capture was blocked by the original app ANR and those layouts remain provisional. Dark feed artwork uses existing original assets, not captured content. Source data density, original typography/icon details, remaining native and global visual comparisons are still open.

final result: blocked


Standalone `../runs/navigation-native/20260911T074558/result.json` subsequently passed all five native tab destinations and Record entry/back with the prior draft intact. Native Profile/Hooks/Record screenshots were opened. The user-facing Reduce motion setting was exercised and restored to its prior false value. No microphone input was captured and this does not resolve native recording or visual acceptance.

## Search / creator update, 2026-09-11 09:48 UTC

Source references search01–search11 extend the prior full03–full08 Search observations. PNGs were opened. Camera permission was captured with the actual permission-controller package after the source-package focus guard correctly rejected that external window; no guard was loosened. Back dismissed permission, then returned the camera entry to discovery. No source photo, follow, comment or purchase was submitted.

Web 094627 passed Search phases, five category filters, See All, creator-versus-own-profile distinction, local follow/list/reload/unfollow, independent creator share recipient, playlist return, real audio progress, empty/clear/close. 093755 failed because selected tabs lacked a Web `aria-selected`; fixed the runtime property, preserving the assertion. 094433 failed because the test used an ambiguous Close sheet locator (backdrop and handle); it now clicks the explicit handle, as existing checks do. Navigation 094435 passed actual five tabs and cross-screen creation/library/profile flows.

Paired 393 × 777 comparisons under `runs/search-visual/20260911` are private review artifacts. Reference crop excludes Android status/navigation insets; this is a Web geometry comparison, not Android acceptance. Corrected discovery headings/spacing/comment statistics are closer. Different lawful art, only two catalog tracks, source countdown/featured collections/Staff Picks column density and icon differences remain. Creator comparison revealed the banner extending below its container on Web: explicit image dimensions and hero clipping are being built and verified. Empty/populated content differs from the source creator, so this comparison does not establish content-state parity. No full visual pass is recorded.

Android 094432 built and installed without clearing data. Native Search checks are in progress. Prior build 093753 compiled but failed its immutable-source gate because source changed during the build; retain that failed receipt and do not install it as a current artifact. Final source/preview/APK correspondence must be rechecked after the banner fix.

Native diagnostic 095436 initially attributed keyboard disappearance to a category tap. A new pre-category assertion in 095727 localized it to the injected hardware Enter instead. The installed React Native `ReactEditText.onKeyUp(KEYCODE_ENTER)` explicitly hides the IME even with submitBehavior=submit. The next check must press the visible software keyboard Search action to verify the actual touch workflow, and separately retain hardware-Enter behavior as a source/platform discrepancy; do not remove keyboard-preservation assertions or claim a pass from these runs. Startup 094743 failed UIAutomator idle on Create's live background; the next run uses the verified visible Search tab coordinate, then asserts Search page, without disabling animation.

Final unit receipt: Web 095054 and Android 100014 passed their recorded Search/creator workflows. The software keyboard Search action preserves IME through category selection, Android Back retains results, creator return retains query/category, and local following survives force-stop and is restored afterward. Native 03/05 PNGs opened. The hardware-Enter difference remains pending. Creator-fit-corrected pair opened: overflow fixed; lawful banner color/texture and source empty versus local populated content differences still block full visual equivalence. Current matching source/Web/Android inputs are recorded in continuation-0954.json (69 files). No global G1, visual, iOS or publication pass is inferred.

## Profile editor, 2026-09-11 10:49 UTC

Source profile01–profile10 references were opened and indexed privately. Actual full-screen editing includes identity, avatar/cover source menus, grouped name/username, biography and six social fields. Original values were not edited or saved. Source gallery/camera menu entry and Back were observed; source validation/permission/file/camera outcomes remain incomplete.

Web profile 103208 passed cancel, disabled/valid save, six normalized links, invalid username/URL rejection, Settings origin return, real gallery file selection and avatar/cover/text reload persistence. Native profile 103955 passed unchanged Save, cancel, both image menus/Back, actual keyboard input/Save bounds, name save/restart and original-name restoration, Settings edit return. Native actual gallery/camera content and large-image/storage failures remain unverified. Local validation limits are candidate rules, not claimed source limits.

The first editor pair was mistakenly captured during its opening transition: underlying Profile was visible. That image is retained as transient evidence. A subsequent capture waits for the header to arrive, and the settled pair is opened. Group geometry and biography padding now match more closely; generated art, action font, identity vertical spacing and brand icons still differ. Native post-restart image revealed light status icons on the light modal inset; explicit modal dark status style is now being rebuilt. No full visual pass.

Navigation 103551 failed before producing images; screenshot error then an uninitialized result variable masked the underlying failure. The runner now records the exception before attempting an optional failure image; no behavior assertions removed. Run 103954 exposed ERR_CONNECTION_REFUSED. Preview session62920 was terminal exit143, no process and no8082 listener, so the same tested export was safely restarted as detached pid93850. The cause of termination is unknown, not classified as a browser or application defect. Navigation104718 passed the original assertions after service recovery.

Final Web iteration 105655 passed the same profile assertions after the explicit status style, 16 dp action labels and 6 dp identity alignment adjustment. `editor-action-size-pair.png` was opened; lawful artwork and example data remain different, and broader source states/brand silhouettes still prevent full visual acceptance. Web105232 and Android105653 share 71 exact canonical inputs. Android105653 has been installed with data preserved; native post-restart status-bar verification is ongoing. Current preview is the same Web artifact under detached pid95078, verified HTTP200; source/production hashes are recorded in continuation-profile.json.

Native final iteration `profile-native/20260911T110257/result.json` passed the recorded unchanged/edited/cancel/name keyboard/save/restart/image-menu/Settings-return checks and restored the original local name. Opened `04-name-after-restart.png`: status icons remain white on the light surface despite the explicit Modal StatusBar. The attempted contrast fix is ineffective and remains an open visual defect; functional pass must not be read as visual acceptance. Current Web105232 and Android105653 match 71 canonical runtime inputs. Native image selection/storage/permission branches and full Profile/Settings remain incomplete.

### Subscription and downloads continuation

Source: `../spec/subscription-reference-followup-20260911.json`, especially settings02 downloads, settings03 Pro promotion, settings05 packs and settings06 all plans. Original 1080×2340 at 2.75 density; crop (0,136,1080,2272) normalized to 393×777. Implementation `../runs/subscription-web/20260911T113828/`, headless isolated system Chrome at 393×777. Private paired comparisons in `../runs/subscription-visual/20260911/*-pair-first.png` and `*-pair-second.png` were opened for downloads/plans/packs. Packs compare original 1-selected with local 3-selected; this is a known comparison-state mismatch, not a selection defect. A matching-state followup is still needed before full visual acceptance.

First iteration found oversized plan cards, a wide serif fallback and a clipped cassette hero below a black header. Card padding/dividers were corrected; Instrument Serif was bundled with OFL; hero moved behind the header. Second comparison shows plan cards now close to measured height/vertical rhythm and the complete CTA/policy region visible. Downloads layout aligns in the principal summary/footer regions. Source accounts/images are not shipped; cassette is original generated art.

Remaining P2: display serif shape/baselines are still not exact; standard body/price typography differs; promotion hero lighting/crop differs; CTA grain and animated color distribution remain a flat-gradient approximation; all-plans background lacks the source's visible brown/navy tint; source policy/store destinations and deeper settings are not complete. Local simulation disclosure adds a deliberate, necessary visible distinction; does not waive other visual checks. Icon silhouette and transition timing need further comparison. **Final result: blocked** for full visual acceptance.

Functional Web 113828 passed selection, parent-return retention, monthly/annual prices, demo-policy routes, review/processing cancellation, simulated error/retry, actual browser storage-write refusal/recovery, transaction idempotency and allowance/plan/model reload persistence. Console page errors: none. Global navigation 113828 also passed existing cross-module assertions. Earlier failures retained: 112417 exposed missing web radio aria-checked (fixed in application); 112811 exposed an injected Storage method accidentally returned from page.evaluate (fixed in test, assertions retained). No skipped required branch is counted as passed. Android build113828 passed, native interaction checks pending at this checkpoint. Profile editor's onShow now explicitly reapplies native bar style after the Modal window exists; effectiveness awaits native screenshot review.

Matched-state packs comparison (`packs-pair-matched.png`) now compares initial 1-credit selection on both sides; opened. Selection styling is correctly applied. Residual font/crop/CTA-texture differences remain. Native114437 failure retained: the failure-simulation button inherited the previous processing Cancel content description through native view reuse; the current tree exposed two Cancel demo purchase nodes. Explicit button labels and background accessibility exclusion were added, retaining the uniqueness assertion. Native retry requires a rebuilt APK.

Native download screenshot114437/01 was opened: onShow now yields dark readable status icons on the light allowance screen. This does not yet close the separate ProfileEditor defect. Final subscription code adds explicit accessible names on every changing checkout/navigation action and hides background content from accessibility while reviewing a demo order. Web115128 passed after this patch; final model test additionally requires exact visible `v6` text and persisted `model === 'v6'`, so `v6-mini` cannot satisfy that check through a substring.

Final Android115437 passed the unchanged native navigation/selection/review-cancel/failure-cancel assertions after rebuilding. It restored the initial allowance and returned Profile. Successful native simulated purchase, storage recovery and allowance restart remain unverified. The nominal 07 profile screenshot was captured before editor presentation and shows the underlying Profile; it cannot prove editor bar contrast. A separate settled capture waits for the actual Profile display name input. Small Web320×568 failure checkout keeps Cancel fully visible at y444.5–492.5 (`subscription-responsive/small-error-result.json`). Final Web115341 passes exact visible/persisted v6 selection. Current matching76 runtime inputs: Web114845 / Android115128, APK `1e3262ac7dc7840ba8c2db83aa5dec661cdd54f26318516559a746f78893eab7`.

Settled ProfileEditor screenshot `../runs/profile-bar-native/20260911T115859/editor-settled.png` was opened after asserting the actual name input. Dark status icons are now readable on the light surface; the onShow style reapplication fixes this observed contrast defect. It does not close other editor visual or image-storage/platform gaps. Device lease released; no build/native test still running at this checkpoint.

### Own Profile continuation, 2026-09-11

Reference `../spec/own-profile-followup-20260911.json` records the own empty profile and lower card, dedicated completion name/photo entry, source system sharing boundary and notification page. Own01/02/05/10/13 PNGs were opened. Source Step 1 Next used the unchanged existing name and persisted progress at Step 2; no source text/media was edited, but this is a real progress state change and is not reported as mutation-free.

Pairs `../runs/own-profile-web/20260911T123237/profile-main-pair.png` and `../runs/own-profile-web/20260911T123635/profile-main-pair.png` were opened at matched 393×777 content viewport. First comparison exposed excessive vertical spacing and overly heavy section headings; corrected hero/completion/header spacing and regular heading weight bring card/carousel/Songs positions close. Second comparison still differs in original artwork color/grain, glyph silhouettes, top action baseline, body contrast, hero Edit tint and the global Profile selection highlight. Initial account identity is intentionally replaced with local demo data. Populated profile, scrolled header tint, keyboard/motion and full native visual fidelity are not accepted. **Final result remains blocked for full visual acceptance.**

Own-profile Web123728 passes top Upgrade origin return, notification return, cross-page local follow, hide/show/dismiss persistence, setup cancel/blank/photo-required states, actual file selection, independent shared-profile receiving/follow reload, footer edit/Create routing and 320px top-action bounds. Navigation123635 passes actual audio, create/save/playlist/share/delete and Library Liked cross-data assertions. Editor123237 retains real file/text/link persistence assertions after updating name-count expectations for hero/footer. Earlier new-test failures were retained; missing follow ARIA state was repaired in application, modal title and sheet close locators were disambiguated without dropping behavior assertions.

Partial units remain explicit: completion original steps 3/4, notification full-page UI and permissions, source recommendation mutation outcomes, native photos/save failure and full media/song profile sharing. Candidate local fallback into the editor is not acceptance of source completion. Android123329 was interrupted with tool exit143 before producing a result; no artifact accepted. Detached retry Android123619 built successfully from the final 78-input snapshot; actual native interaction checks remain separately recorded.


Native own-profile124053 passed the recorded Upgrade/Settings/Downloads returns, actual Android Sharesheet/Back without selecting a recipient, setup cancel, notifications Back, shared local follow state and native creator return; original Northlight follow restored. Opened native01/05 PNGs. Full-frame matched initial source/native pair saved as main-native-pair.png. Native profile hero does not extend into the status area as the source does; source/target icon shapes, type color and selected Profile navigation pill differ. Lower snapshots have different scroll offsets and are not a pixel acceptance pair. Functional pass does not waive full visual gaps.

### Notification page and system boundaries

The initial source own13 reference and new notice04 dismissed-banner reference were paired with headless production Web at 393×777 after excluding source system insets. Both before/after banner pairs were opened. The notification route is now a complete content page with global navigation and a retained origin; the previous Sheet was not source-correct. First comparison led to regular header weight, tighter illustration width and adjusted artwork position. Banner dismissal recenters the empty state; local preference guidance is placed at the bottom without shifting its center. Remaining differences include generated illustration depth/shadow/vertical proportions, minor text baselines/widths, glyph shapes and transition timing. The explicit local-demo explanation adds a necessary visible distinction. Full visual acceptance remains blocked.

Source notification switch opened a real Android permission dialog. The normal reference gate rejected the external foreground; this was preserved, and a separate system diagnostic PNG/XML was opened. Back canceled without Allow/Don’t allow. Source banner dismissal persisted after Back/reentry. Source Settings Language opened Android App language settings (System default selected), separately captured as system evidence; no locale changed. Source screenshots and system diagnostics remain private and are not runtime assets.

Web notifications130726 passed injected permission denial/cancel/error/retry/grant, actual browser-storage failure/retry and dismissal/reload, origin/global navigation, local activity/player/read/reload, and a separate unmocked browser granted-permission context. Permission request injection is explicit and cannot substitute for native permission dialogs. Earlier125909 exposed a real missing retry action after permission exception; app now retries the matching failed action, including storage. Test130524 incorrectly assumed a bell in submitted Search results; corrected to use the observed discovery bell plus Profile-notification round-trip query retention. Audio pause uses the actual full-player control. Original assertions about audio and state persistence remain.

Final Web130256 / Android130448 build snapshots include the new manifest permission and original RGBA asset. Android native files were regenerated through existing Expo prebuild, with POST_NOTIFICATIONS confirmed in the generated manifest. Known expo-system-ui prebuild warning remains; no theme compatibility is claimed from prebuild success. Original granted/populated notification states, all notification types and destinations, native push delivery, iOS/pre-API33 permission controls, full Settings and remaining Goal units are incomplete.

Native notifications131105 passed actual Android permission cancellation, denial, grant, restart persistence, opening real App Settings and returning, and restoration of the exact prior prototype permission grant/flags. Original Suno permission was untouched by these prototype tests. Native01 banner and04 granted PNGs were opened. Permission success is not push-service delivery. Source native title/card/text baselines and original illustration still differ; full visual acceptance remains blocked. Final canonical/Web130256/Android130448 share81 exact runtime inputs, with checked production output hashes. Device lease released and no native/build task pending at this checkpoint.

### Settings and theme follow-up

Matched source/Web Settings and Appearance pairs are recorded under settings-web140059 and141023, with source system insets excluded to compare the same393×777 content viewport. The first images exposed oversized labels, an8dp row shift, a tall Theme heading region, low contrast over the dark-profile cover and an unintended three-line promotion headline. The corrected candidate uses16/22dp rows,24/32dp Appearance title, a40dp heading region, a full-height dark cover fade and a wider live headline measure. Corrected pairs and Profile/offer images were opened. Radio/menu semantics and actual write failures are checked, but glyph silhouettes, source font identity, artwork lighting/colors, missing account-closure footer, remaining theme pages and motion are still incomplete. Do not equate these improvements with visual acceptance.

Settings141023 passes the recorded full-page returns, model menu/premium offer, persistent theme and browser system scheme changes, local report save/retry/copy/reload, local FAQ, shared paid-model state and local logout/reentry/storage recovery. Navigation and own-profile140821 pass affected journeys. Previous tests and failures remain: the backdrop coordinate is now within its visible area below the fixed header; a subscription text assertion is scoped to its current dialog; Storage restoration uses a statement callback instead of returning an unbound native method. Assertions were not removed or relaxed. New runtime configuration declares automatic appearance with expo-system-ui; Android behavior remains separate from this configuration/build evidence. Original App language settings, Typeform and help-site boundaries are documented; English-only/local-help implementations are explicitly incomplete against their full original flows.

Native141114 exposed a real missing localeConfig: Android started the locale picker then refused to show its UI. Logs and failed screenshots were retained. The correction uses expo-localization57.0.1 with the currently supported English locale, followed by actual prebuild, rebuild and install-r. Native142547 now passes the actual Android App language page with System default/English options and Back, along with model/child-page returns and persistent Dark mode restored to System. Opened the system language and native dark Appearance images. No language was selected; German/Spanish and native successful local logout/report writes remain open. Final Web141852/Android142008 use86 identical canonical runtime inputs. New source dark Search/Create/Library references were opened and source System theme restored; their implementation remains the next theme task. Newly observed timed credit-free upgrade entry stays in the expanded88-candidate scope as unimplemented. No full visual or delivery acceptance is claimed.


### 2026-09-11 Main theme extension — private review, not full visual acceptance

Source theme01–03 in `../spec/theme-followup-20260911.json` establishes dark Search, Simple Create and empty Library. Main page/surface colors, inputs, inverse pills, navigation, song rows, mini-player, playlist forms/details and inherited audio/text-editor controls now follow the active theme. Explicit Light/Dark/System storage remains shared with Settings. Legacy creator/player/share/subscription/recording and other variants still require source review and adaptation; this is not complete appearance coverage.

Create retains animation and Reduce Motion handling. The first uniform dark overlay produced a flat gray result; source samples at (160,900)/(520,900)/(1000,900) were RGB(72,46,36)/(53,37,43)/(38,28,42), so dark mode now uses warm-to-purple native gradient layers plus a lower fade. This is a single-phase color approximation, not motion fidelity acceptance. Original light raster remains unchanged. Empty Library’s white rectangle exposed a previously baked background; a transparent-generation attempt returned an RGB checkerboard and was rejected. A separate generated dark-background illustration is selected; small background noise and illustration geometry still differ. No screenshot shell or source UI crop was used.

Initial matched pairs `../runs/main-theme-web/20260911T144635/pair-*.png` were opened. Search palette/spacing and Library title/cards broadly align; fonts, icons, source promotion/countdown, Create model border/header/banner, decorative assets and animation still differ. Main-theme tests preserve failures for Instrumental’s collapsed control and retained playlist route: test navigation was corrected to expand/return before asserting the original state, without dropping assertions. Full visual and platform gates remain incomplete.


### 2026-09-11 Create promotion and model selector — private evidence

`../spec/credit-offer-followup-20260911.json` records18 original references. Simple and Advanced credit-free banners both open the existing Annual/Pro plans page and return to the same mode. Source model dropdown contains descriptions, Pro badges and a checked mini row; v6/v6-wild open the dedicated v6 promotion, then Upgrade now opens plans. Original purchases and account data were not changed; Simple mode was restored after observation.

Measured header geometry: model92×40dp at top12/right16; mode center32dp; offer center74dp; dropdown top52/right16/width300/radius8, with source clickable row heights180/180/218px at2.75density. CreateHeader and CreateModelMenu now render these actual controls; the menu uses an anchored transparent modal, and radio/checked semantics fix a Web accessibility-state failure discovered by testing. Existing shared entitlements and v6 promotion handle selection, cancellation, upgrade and failure/retry.

The visibly labeled Demo countdown stores a24h local deadline. Valid/expired deadlines do not reset on reload, time updates at minute/expiry boundaries and foreground return; storage errors can retry and malformed local timer data has an explicit Reset demo offer action. Source campaign activation, expiry and paid visibility remain unobserved; local Free/paid visibility and expiry are declared simulation behavior, not claims about Suno service rules or benefits. Gradient border orientation varies in source captures; current static gradient is not motion acceptance.

Web credit-offer160606, subscription160606, main-theme160606 and navigation161217 passed actual journeys/storage/reload/real short-deadline transitions. Original web155543 failure is retained: button selection state omitted DOM aria attributes; changed to radio/checked rather than removing the assertion. Matched393×777 header/menu pairs actually opened. Top placement/menu geometry are close, with font, aura texture, icons, Demo label/state and motion differences still unaccepted. Native credit-offer161202 passed a separate model/offer/banner/Back subset using measured header entry coordinates; it does not waive the earlier dynamic Create full UI-tree idle failure. Native screenshot then exposed percentage SVG sizing shrinking outline to the button content box, leaving the arrow outside. Explicit92×40 sizing is being rebuilt for native visual recheck; prior interaction pass is not proof of final visual fidelity.


## S1 命名框校验增量 — 2026-09-18（functional，非视觉保真）

S1（P1）批次内真实缺口：Saved Lyrics/Styles 命名（保存/重命名）对话框此前无错误态。本轮在 `src/TextEditor.tsx` 增加内联校验：空名 / 同类型已保存项重名（case-insensitive，重命名排除自身）/ 超 40 字符 → inline 错误（`dialogError` 样式）并禁用 Save（opacity 0.35，aria-label 区分 `Save named item` / `Save disabled until the name is valid`）。

验证（构建级，非像素/交互级）：tsc rc=0；成果出口审核双 scope 通过（worktree 174 路径 0 findings、history 6 commit 对象 0 findings）；构建 bundle 含 `already exists` / `Names must be 40` / `Save disabled until`；内部测量/重建注释未进出版副本且不在 bundle。GitHub API 复核 commit `f62a79a006521a1caa9e8c1e24e68b784827d552`（200，作者 migrant620）已上 `migrant620/suno-ui`。

限制（如实登记）：环境无无头 Chrome/Playwright，未做端到端交互/像素验收；EdgeOne Demo `https://suno-ui.edgeone.cool/` 沙箱实测 HTTP 401（`server: edgeone makers`，腾讯 EdgeOne 错误页 = Pages 项目访问密码保护），仅以部署回执（Deployment `dp5r2uw29veq`，status=success）作为部署成功证据，未声称匿名公开可达。本条目不推断任何视觉/平台保真通过。
