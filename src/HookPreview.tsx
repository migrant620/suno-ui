import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { HookVideo } from './HookVideo';
import { ExampleHook } from './hookData';
import { HookVideoControl, HookVideoState } from './hookVideoTypes';
import { Icon, Label } from './ui';
export function HookPreview({ clip, active, onOpen, position }: {
    clip: ExampleHook;
    active: boolean;
    onOpen: () => void;
    position: React.MutableRefObject<Record<string, number>>;
}) {
    const video = useRef<HookVideoControl>(null);
    const [state, setState] = useState<HookVideoState>({ playing: false, current: 0, duration: 0, loading: true, error: '' });
    return <View testID="hooks-feed" style={{ flex: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden', backgroundColor: '#000000' }}>
    <HookVideo ref={video} source={clip.video} active={active} muted initialTime={position.current[clip.id] || 0} onState={next => { setState(next); position.current[clip.id] = next.current; }}/>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open hook ${clip.track.title}`} onPress={() => { video.current?.pause(); onOpen(); }} style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
      {state.loading ? <ActivityIndicator color="#FFFFFF"/> : !state.playing && <Icon name="play" size={48} color="#FFFFFF"/>}
      <View style={{ position: 'absolute', bottom: 10, left: 12, right: 12 }}><Label style={{ color: '#FFFFFF', fontSize: 10, textShadowColor: '#000', textShadowRadius: 3 }}>Local example video · Original art and music</Label>{!!state.error && <Label style={{ color: '#FFFFFF', fontSize: 12 }}>{state.error}</Label>}</View>
    </Pressable>
  </View>;
}
