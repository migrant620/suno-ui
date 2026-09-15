const { withDangerousMod, withMainApplication } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
module.exports = function withVoiceAudio(config) {
  config = withMainApplication(config, config => {
    const registration = 'add(dev.m620.sunoui.audio.SunoAudioPackage())';
    const anchor = 'PackageList(this).packages.apply {';
    if (!config.modResults.contents.includes(registration)) {
      if (!config.modResults.contents.includes(anchor)) throw new Error('Cannot register SunoAudio in MainApplication');
      config.modResults.contents = config.modResults.contents.replace(anchor, `${anchor}\n          ${registration}`);
    }
    return config;
  });
  return withDangerousMod(config, ['android', async config => {
    const target = path.join(config.modRequest.platformProjectRoot, 'app/src/main/java/dev/m620/sunoui/audio');
    fs.mkdirSync(target, { recursive: true });
    for (const name of ['SunoAudioPackage.java', 'SunoAudioModule.java', 'SunoKeyboardModule.java']) fs.copyFileSync(path.join(__dirname, name), path.join(target, name));
    return config;
  }]);
};
