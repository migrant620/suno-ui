import React, { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName, Label } from './ui';
import { useSurfaceColors } from './Theme';
import { useSheetEscape } from './useSheetEscape';
export function AddToSongMenu({ anchor, onClose, onVoice, onImage, onVideo, onAdvanced }: {
    anchor: React.RefObject<View | null>;
    onClose: () => void;
    onVoice: () => void;
    onImage: () => void;
    onVideo: () => void;
    onAdvanced: () => void;
}) {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const colors = useSurfaceColors();
    const root = useRef<View>(null);
    const [position, setPosition] = useState<{
        left: number;
        top: number;
    } | null>(null);
    useSheetEscape(onClose, root);
    useEffect(() => {
        let active = true;
        anchor.current?.measureInWindow((x, y, _w, h) => {
            if (active)
                setPosition({ left: Math.max(8, Math.min(x, width - 188)), top: Math.max(insets.top, Math.min(y + h, height - insets.bottom - 216)) });
        });
        return () => { active = false; };
    }, [anchor, width, height, insets.top, insets.bottom]);
    const items: {
        title: string;
        icon: IconName;
        size?: number;
        action: () => void;
    }[] = [
        { title: 'Voice', icon: 'account-voice', action: onVoice },
        { title: 'Image', icon: 'image', size: 16, action: onImage },
        { title: 'Video', icon: 'movie-play', size: 16, action: onVideo },
        { title: 'Advanced', icon: 'tune-vertical', action: onAdvanced },
    ];
    return <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
    <View style={StyleSheet.absoluteFill}><Pressable accessibilityRole="button" accessibilityLabel="Dismiss Add to Song menu" onPress={onClose} style={StyleSheet.absoluteFill}/>
      {position && <View ref={root} testID="add-to-song-menu" style={[M.menu, position, { backgroundColor: colors.surface === '#101012' ? colors.toolbar : '#E0DEDA' }]}>
        {items.map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={item.title} onPress={item.action} style={({ pressed }) => [M.row, pressed && { backgroundColor: '#1010120A' }]}><View style={{ width: 20, height: 24, alignItems: 'center', justifyContent: 'center' }}><Icon name={item.icon} size={item.size || 20}/></View><Label style={M.label}>{item.title}</Label></Pressable>)}
      </View>}
    </View>
  </Modal>;
}
const M = StyleSheet.create({ menu: { position: 'absolute', width: 180, borderRadius: 20, paddingVertical: 8, overflow: 'hidden', boxShadow: '0px 6px 10px #00000026' }, row: { height: 48, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }, label: { fontSize: 16, lineHeight: 24 } });
