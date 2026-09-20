import { ProfilePickerSession } from './profilePickerSession';
import { DeleteAccountDialog } from './DeleteAccountDialog';
import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, setStatusBarStyle } from 'expo-status-bar';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from './accountStorage';
import * as Clipboard from 'expo-clipboard';
import { useDemoEntitlements, MusicModel } from './useDemoEntitlements';
import { useLocalProfile } from './useLocalProfile';
import { useLocalSession } from './LocalSession';
import { ProfileEditor } from './ProfileEditor';
import { SubscriptionFlow } from './SubscriptionFlow';
import { ModelOffer } from './ModelOffer';
import { ThemeColors, ThemeMode, ThemedSurface, LightSurface, useTheme } from './Theme';
import { Icon, IconButton, IconName, Label } from './ui';
type Route = 'settings' | 'appearance' | 'language' | 'report' | 'support' | 'about' | 'logout';
export function SettingsFlow({ account, entitlements, onClose, recovery, onRecoveryClosed }: {
    recovery?: ProfilePickerSession | null;
    onRecoveryClosed?: () => void;
    account: ReturnType<typeof useLocalProfile>;
    entitlements: ReturnType<typeof useDemoEntitlements>;
    onClose: () => void;
}) {
    const theme = useTheme();
    const C = theme.colors;
    const S = styles(C);
    const session = useLocalSession();
    const [route, setRoute] = useState<Route>('settings');
    const [child, setChild] = useState<'edit' | 'downloads' | 'plans' | null>(recovery ? 'edit' : null);
    const [windowReady, setWindowReady] = useState(Platform.OS === 'web');
    const [modelMenu, setModelMenu] = useState(false);
    const [offer, setOffer] = useState(false);
    const [deletion, setDeletion] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [busy, setBusy] = useState(false);
    const [report, setReport] = useState('');
    const [savedReport, setSavedReport] = useState('');
    const [reportPhase, setReportPhase] = useState<'edit' | 'review' | 'saved'>('edit');
    const [faq, setFaq] = useState<number | null>(null);
    const changeRoute = (next: Route) => { Keyboard.dismiss(); setModelMenu(false); setError(''); setNotice(''); setRoute(next); };
    const back = () => { if (busy)
        return; if (deletion)
        setDeletion(false);
    else if (offer)
        setOffer(false);
    else if (modelMenu)
        setModelMenu(false);
    else if (route === 'report' && reportPhase !== 'edit')
        setReportPhase('edit');
    else if (route !== 'settings')
        changeRoute('settings');
    else
        onClose(); };
    const title = { settings: 'Settings', appearance: 'Appearance', language: 'Language', report: 'Report a problem', support: 'Support', about: 'About this prototype', logout: 'Log out' }[route];
    const chooseModel = async (model: MusicModel) => {
        if (!entitlements.ready || busy)
            return;
        setModelMenu(false);
        setError('');
        if (model !== 'v6-mini' && entitlements.data.plan === 'Free') {
            setOffer(true);
            return;
        }
        setBusy(true);
        try {
            await entitlements.selectModel(model);
        }
        catch {
            setError('The model could not be saved. Select it again to retry.');
        }
        finally {
            setBusy(false);
        }
    };
    const language = async () => {
        changeRoute('language');
        if (Platform.OS !== 'android')
            return;
        setBusy(true);
        try {
            await IntentLauncher.startActivityAsync('android.settings.APP_LOCALE_SETTINGS', { data: 'package:dev.m620.sunoui' });
        }
        catch {
            setError('App language settings could not be opened. Try again.');
        }
        finally {
            setBusy(false);
        }
    };
    const saveReport = async () => {
        if (busy || !report.trim())
            return;
        setBusy(true);
        setError('');
        try {
            await AsyncStorage.setItem('suno-ui:problem-report:v1', JSON.stringify({ text: report.trim(), savedAt: new Date().toISOString() }));
            setSavedReport(report.trim());
            setReportPhase('saved');
        }
        catch {
            setError('The report could not be saved on this device. Try again.');
        }
        finally {
            setBusy(false);
        }
    };
    const openReport = async () => {
        changeRoute('report');
        setReportPhase('edit');
        setBusy(true);
        try {
            const raw = await AsyncStorage.getItem('suno-ui:problem-report:v1');
            if (raw) {
                const value = JSON.parse(raw);
                if (typeof value.text !== 'string')
                    throw new Error('Invalid report');
                setReport(value.text);
                setSavedReport(value.text);
            }
        }
        catch {
            setError('Your last local report could not be loaded. Reopen this page to retry.');
        }
        finally {
            setBusy(false);
        }
    };
    const action = (label: string, onPress: () => void, disabled = false) => <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={disabled} style={[S.action, disabled && { opacity: 0.4 }]}><Label style={S.actionText}>{label}</Label></Pressable>;
    const row = (label: string, icon: IconName, onPress: () => void, accessibilityLabel = label, trailing?: React.ReactNode) => <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={({ pressed }) => [S.row, pressed && { opacity: 0.55 }]}><Icon name={icon} color={label === 'Log out' ? '#FF0000' : C.ink} size={24}/><Label style={[S.rowText, label === 'Log out' && { color: '#FF0000' }]}>{label}</Label>{trailing || (label !== 'Log out' && <Icon name={label === 'Report a problem' || label === 'Support' ? 'arrow-top-right' : 'chevron-right'} size={label === 'Report a problem' || label === 'Support' ? 20 : 28}/>)}</Pressable>;
    return <ThemedSurface><Modal visible animationType="slide" onRequestClose={back} onShow={() => { setStatusBarStyle(theme.dark ? 'light' : 'dark'); setWindowReady(true); }}><StatusBar style={theme.dark ? 'light' : 'dark'}/><View style={S.desktop}><SafeAreaView edges={['top', 'bottom']} style={S.page}><View style={{ flex: 1 }} pointerEvents={child || offer || deletion ? 'none' : 'auto'} aria-hidden={!!child || offer || deletion} importantForAccessibility={child || offer || deletion ? 'no-hide-descendants' : 'auto'}>
    <View style={[S.header, route === 'appearance' && { height: 96 }]}><IconButton name="chevron-left" label={route === 'settings' ? 'Back from settings' : 'Back to settings'} onPress={back} style={S.back}/><Label style={[S.title, route === 'appearance' && { fontSize: 24, lineHeight: 32 }]}>{title}</Label></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[S.content, route === 'appearance' && { paddingHorizontal: 12 }, route === 'settings' && { marginTop: -8 }]} onScrollBeginDrag={() => setModelMenu(false)}>
      {modelMenu && <Pressable accessibilityRole="button" accessibilityLabel="Dismiss model menu" onPress={() => setModelMenu(false)} style={[StyleSheet.absoluteFill, { zIndex: 2 }]}/>}
      {route === 'settings' ? <>
        {row('Edit Profile', 'pencil', () => setChild('edit'), 'Edit profile from settings')}
        {row('My Subscription', 'music-circle', () => setChild('plans'), 'My Subscription', <View style={S.upgrade}><Label style={S.rowLabel}>{entitlements.data.plan === 'Free' ? 'Upgrade now' : `${entitlements.data.plan} Plan`}</Label><Icon name="chevron-right" size={24}/></View>)}
        {row('My Downloads', 'download', () => setChild('downloads'))}
        <View style={[S.row, { zIndex: 3 }]}><Icon name="hexagon-slice-6" size={24}/><Label style={S.rowText}>Music Model</Label><Pressable accessibilityRole="button" accessibilityLabel="Settings music model" accessibilityState={{ expanded: modelMenu, disabled: !entitlements.ready || busy }} disabled={!entitlements.ready || busy} onPress={() => setModelMenu(value => !value)} style={S.model}><Icon name="chevron-down" size={20}/><Label style={S.modelText}>{entitlements.data.model}</Label></Pressable>{modelMenu && <View style={S.modelMenu}>{(['v6', 'v6-wild', 'v6-mini'] as const).map(model => <Pressable key={model} accessibilityRole="button" accessibilityLabel={`Choose model ${model}`} onPress={() => void chooseModel(model)} style={S.modelOption}><Label style={S.modelText}>{model}</Label></Pressable>)}</View>}</View>
        {row('Appearance', 'circle-half-full', () => changeRoute('appearance'))}
        {row('Language', 'web', () => void language())}
        {row('Report a problem', 'flag', () => void openReport())}
        {row('Support', 'phone', () => changeRoute('support'))}
        {row('Log out', 'logout', () => changeRoute('logout'))}
        <View style={S.footer}><Label style={S.footnote}>Suno UI Prototype · v0.1.0</Label><Label style={S.footnote}>Local demo · Saved on this device</Label><Pressable accessibilityRole="button" accessibilityLabel="Close local account" onPress={() => setDeletion(true)} style={S.closeAccount}><Label style={S.closureCopy}>To close your local account and delete your songs and data, <Label style={S.closureLink}>click here</Label></Label></Pressable><Pressable accessibilityRole="button" accessibilityLabel="About this prototype" onPress={() => changeRoute('about')} style={S.textAction}><Label style={S.link}>About this prototype</Label></Pressable></View>
      </> : route === 'appearance' ? <><View style={{ height: 40, justifyContent: 'center' }}><Label style={S.section}>Theme</Label></View>{([['light', 'Light Mode'], ['dark', 'Dark Mode'], ['system', 'Use device settings']] as [
            ThemeMode,
            string
        ][]).map(([mode, text]) => <Pressable key={mode} accessibilityRole="radio" accessibilityLabel={text} aria-checked={theme.mode === mode} accessibilityState={{ checked: theme.mode === mode, disabled: !theme.ready }} disabled={!theme.ready} onPress={() => void theme.select(mode)} style={S.themeRow}><Icon name={theme.mode === mode ? 'radiobox-marked' : 'radiobox-blank'} color={theme.mode === mode ? C.primary : C.muted} size={24}/><Label style={S.rowLabel}>{text}</Label></Pressable>)}{!!theme.error && <View style={S.feedback}><Label accessibilityRole="alert" style={S.error}>{theme.error}</Label>{action('Retry theme', theme.retry)}</View>}</>
            : route === 'language' ? <View style={S.body}><Label style={S.bodyTitle}>App language</Label><Label style={S.paragraph}>{Platform.OS === 'android' ? 'Language preferences open in Android settings. This demo currently displays its interface in English.' : 'This local demo currently displays its interface in English. Your browser language does not change your saved music or profile.'}</Label>{Platform.OS === 'android' && action('Open app language settings', () => void language(), busy)}</View>
                : route === 'report' ? <View style={S.body}><Label style={S.bodyTitle}>{reportPhase === 'saved' ? 'Report saved locally' : reportPhase === 'review' ? 'Review your report' : 'Thanks for reporting a bug!'}</Label><Label style={S.paragraph}>Describe the screen you were using, what happened, and what you expected. Reports in this demo stay on this device and are not sent to Suno.</Label>{reportPhase === 'edit' ? <><TextInput accessibilityLabel="Problem description" multiline value={report} onChangeText={setReport} placeholder="What happened?" placeholderTextColor={C.muted} maxLength={4000} style={S.input}/><Label style={S.footnote}>{report.length}/4000</Label>{action('Review local report', () => { Keyboard.dismiss(); setReportPhase('review'); }, !report.trim() || busy)}</> : <><Label style={S.reportText}>{reportPhase === 'saved' ? savedReport : report.trim()}</Label>{reportPhase === 'review' ? action(busy ? 'Saving report…' : 'Save local report', () => void saveReport(), busy) : action('Copy saved report', () => void Clipboard.setStringAsync(savedReport).then(() => setNotice('Report copied.')).catch(() => setError('The report could not be copied. Try again.')))}{action('Edit report', () => setReportPhase('edit'), busy)}</>}</View>
                    : route === 'support' ? <View style={S.body}><Label style={S.bodyTitle}>Help with this demo</Label>{[['Where are my songs?', 'Saved local examples appear in Library and your Profile. Search and playlist membership use the same library.'], ['Does Create generate music?', 'Create saves a clearly labeled example using an original local recording. It does not generate new AI music.'], ['Do upgrades charge money?', 'Plans and download packs use a local purchase simulation. No payment details are collected and no Suno benefits are granted.'], ['What happens when I log out?', 'Logging out closes this local demo session. Your saved examples, playlists and profile remain on the device so you can return.']].map(([question, answer], index) => <View key={question}><Pressable accessibilityRole="button" accessibilityLabel={question} accessibilityState={{ expanded: faq === index }} onPress={() => setFaq(faq === index ? null : index)} style={S.faq}><Label style={{ flex: 1 }}>{question}</Label><Icon name={faq === index ? 'chevron-up' : 'chevron-down'}/></Pressable>{faq === index && <Label style={S.paragraph}>{answer}</Label>}</View>)}{action('Report a problem locally', () => void openReport())}</View>
                        : route === 'logout' ? <View style={S.body}><Label style={S.bodyTitle}>Leave this local demo?</Label><Label style={S.paragraph}>Your saved music, playlists and profile stay on this device. This does not sign you out of Suno.</Label>{action(busy ? 'Logging out…' : 'Log out of local demo', () => { setBusy(true); void session.leave().catch(() => { setError('The local session could not be saved. Try again.'); setBusy(false); }); }, busy)}{action('Cancel logout', () => changeRoute('settings'), busy)}</View>
                            : <View style={S.body}><Label style={S.paragraph}>Explore the interface with original local example recordings. Search, songs, playlists and your profile are stored on this device. This prototype does not sign in to Suno, generate AI music, publish content or make purchases.</Label><View style={S.preference}><Label style={S.section}>Local demo preferences</Label><View style={S.preferenceRow}><View style={{ flex: 1 }}><Label>Reduce motion</Label><Label style={S.footnote}>Keep the creation background still.</Label></View><Switch accessibilityLabel="Reduce motion" disabled={!account.ready} value={account.profile.reduceMotion} onValueChange={reduceMotion => { void account.update({ reduceMotion }); }} trackColor={{ true: C.primary, false: C.border }}/></View></View></View>}
      {!!notice && <Label accessibilityLiveRegion="polite" style={S.footnote}>{notice}</Label>}
      {!!(error || entitlements.error || account.error) && <Label accessibilityRole="alert" style={S.error}>{error || entitlements.error || account.error}</Label>}
    </ScrollView></KeyboardAvoidingView></View></SafeAreaView></View>
    {deletion && <DeleteAccountDialog onClose={() => setDeletion(false)}/>}
    {offer && !child && <ModelOffer onClose={() => setOffer(false)} onUpgrade={() => { setOffer(false); setChild('plans'); }}/>}
    {windowReady && child === 'edit' && <LightSurface><ProfileEditor recovery={recovery} origin="settings" account={account} onClose={() => { onRecoveryClosed?.(); setChild(null); }}/></LightSurface>}
    {(child === 'plans' || child === 'downloads') && <LightSurface><SubscriptionFlow initialRoute={child} entitlements={entitlements} onClose={() => setChild(null)}/></LightSurface>}
  </Modal></ThemedSurface>;
}
const styles = (C: ThemeColors) => StyleSheet.create({
    desktop: { flex: 1, backgroundColor: C.surface, alignItems: 'center' }, page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: C.surface }, header: { height: 64, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 18, lineHeight: 24 }, back: { position: 'absolute', left: 20, width: 40, height: 40, borderRadius: 99, backgroundColor: C.field }, content: { paddingHorizontal: 16, paddingBottom: 24 }, row: { minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 16, borderBottomWidth: 1, borderBottomColor: C.divider }, rowText: { flex: 1, fontSize: 16, lineHeight: 22, letterSpacing: 0.12 }, rowLabel: { fontSize: 16, lineHeight: 22, letterSpacing: 1.12 }, upgrade: { flexDirection: 'row', gap: 0, alignItems: 'center' }, model: { marginRight: 16, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderRadius: 99, backgroundColor: C.field }, modelText: { fontSize: 18, lineHeight: 26 }, modelMenu: { position: 'absolute', top: 56, right: 12, width: 112, backgroundColor: C.field, borderRadius: 4, paddingVertical: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: 8 }, modelOption: { minHeight: 48, paddingHorizontal: 12, justifyContent: 'center' }, footer: { paddingTop: 20, gap: 8 }, closeAccount: { maxWidth: 240, minHeight: 48, justifyContent: 'center' }, closureCopy: { fontSize: 12, lineHeight: 24, color: C.secondary }, closureLink: { fontSize: 12, lineHeight: 24, color: C.primary, fontFamily: 'RobotoBold' }, footnote: { fontSize: 12, lineHeight: 18, color: C.secondary }, textAction: { minHeight: 40, justifyContent: 'center', alignSelf: 'flex-start' }, link: { fontSize: 13, color: C.secondary, textDecorationLine: 'underline' }, section: { fontSize: 14, lineHeight: 24, color: C.secondary, fontFamily: 'RobotoBold' }, themeRow: { minHeight: 65, paddingHorizontal: 8, gap: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.divider }, preference: { marginTop: 32, borderTopWidth: 1, borderTopColor: C.divider, paddingTop: 20 }, preferenceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }, body: { gap: 20, paddingVertical: 24 }, bodyTitle: { fontSize: 28, lineHeight: 36, fontFamily: 'RobotoMedium' }, paragraph: { fontSize: 16, lineHeight: 25, color: C.secondary }, action: { minHeight: 48, paddingHorizontal: 20, backgroundColor: C.control, borderRadius: 99, alignItems: 'center', justifyContent: 'center' }, actionText: { fontFamily: 'RobotoMedium', textAlign: 'center' }, input: { minHeight: 170, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: C.divider, backgroundColor: C.field, color: C.ink, fontFamily: 'RobotoRegular', fontSize: 16, lineHeight: 24, textAlignVertical: 'top' }, reportText: { fontSize: 16, lineHeight: 25, padding: 16, backgroundColor: C.field, borderRadius: 12 }, feedback: { gap: 12 }, error: { fontSize: 13, lineHeight: 20, paddingVertical: 16, color: C.surface === '#101012' ? '#FFB1A3' : '#B52B19' }, faq: { minHeight: 60, flexDirection: 'row', gap: 12, alignItems: 'center', borderBottomColor: C.divider, borderBottomWidth: 1 }
});
