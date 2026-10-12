export const socialFields = [
  { key: 'spotify', label: 'Spotify', icon: 'spotify', placeholder: 'open.spotify.com/artist/id', hosts: ['open.spotify.com'] },
  { key: 'instagram', label: 'Instagram', icon: 'instagram', placeholder: 'instagram.com/username', hosts: ['instagram.com', 'www.instagram.com'] },
  { key: 'tiktok', label: 'TikTok', icon: 'music-note', placeholder: 'tiktok.com/@username', hosts: ['tiktok.com', 'www.tiktok.com'] },
  { key: 'soundcloud', label: 'SoundCloud', icon: 'soundcloud', placeholder: 'soundcloud.com/username', hosts: ['soundcloud.com', 'www.soundcloud.com'] },
  { key: 'youtube', label: 'YouTube', icon: 'youtube', placeholder: 'youtube.com/@username', hosts: ['youtube.com', 'www.youtube.com', 'youtu.be'] },
  { key: 'x', label: 'X', icon: 'twitter', placeholder: 'x.com/username', hosts: ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'] },
] as const;
export type SocialKey = typeof socialFields[number]['key'];
export type ProfileLinks = Partial<Record<SocialKey, string>>;
export function socialURL(key: SocialKey, value: string): string | null {
  if (!value.trim()) return '';
  try {
    const url = new URL(/^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`);
    const hosts: readonly string[] = socialFields.find(field => field.key === key)!.hosts;
    if (!hosts.includes(url.hostname.toLowerCase()) || url.username || url.password || url.port || !['https:', 'http:'].includes(url.protocol)) return null;
    url.protocol = 'https:';
    return url.toString();
  } catch { return null; }
}
