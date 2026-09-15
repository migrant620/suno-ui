// Android picker compatibility fixes for the exact dependency versions below.
// Preserve activity results across process death and resume requested image editing.
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const patches = [
  {
    "package": "expo",
    "version": "57.0.21",
    "file": "android/src/main/java/expo/modules/ReactActivityDelegateWrapper.kt",
    "before": "eec543ac66925b0443a219ed79787352b31a14be707db0f9291b18743b040899",
    "after": "ab72a75e0ced8f46aee0792b606ab0a3af218256e21c0198ef9e6f6d46650bee",
    "changes": [
      [
        "import kotlinx.coroutines.launch\n",
        "import kotlinx.coroutines.launch\nimport kotlinx.coroutines.runInterruptible\n"
      ],
      [
        "    launchLifecycleScopeWithLock {\n      loadAppReady.await()\n      delegate.onActivityResult(requestCode, resultCode, data)\n    }",
        "    activity.lifecycleScope.launch {\n      loadAppReady.await()\n      // Context allocation precedes native module initialization. Allow onResume\n      // to run while waiting, otherwise lifecycle initialization can deadlock.\n      reactHost?.let { host ->\n        val ready = host.start()\n        runInterruptible(Dispatchers.IO) { ready.waitForCompletion() }\n        if (ready.isCancelled() || ready.isFaulted()) return@launch\n      }\n      mutex.withLock {\n        delegate.onActivityResult(requestCode, resultCode, data)\n      }\n    }"
      ]
    ]
  },
  {
    "package": "expo-modules-core",
    "version": "57.0.17",
    "file": "android/src/main/java/expo/modules/kotlin/activityresult/AppContextActivityResultRegistry.kt",
    "before": "cb866b0f357f516156824fb17176272fda625cd9aa0bcc608ec3c64a3ab10508",
    "after": "bf9a4a17c49da44871204cca8461aca79241592f3ab308d695bea2d6c7d67380",
    "changes": [
      [
        "    val intent = contract.createIntent(activity, input)\n",
        "    val intent = contract.createIntent(activity, input)\n    // Persist before leaving the process; permission revocation may skip onDestroy.\n    persistInstanceState(activity)\n"
      ],
      [
        "          launchedKeys.remove(key)\n          throw e",
        "          launchedKeys.remove(key)\n          persistInstanceState(activity)\n          throw e"
      ],
      [
        "      pendingResults.putParcelable(key, ActivityResult(resultCode, data))\n    }\n  }",
        "      pendingResults.putParcelable(key, ActivityResult(resultCode, data))\n    }\n    currentActivityProvider.currentActivity?.let { persistInstanceState(it) }\n  }"
      ]
    ]
  },
  {
    "package": "expo-image-picker",
    "version": "57.0.16",
    "file": "android/src/main/java/expo/modules/imagepicker/ImagePickerModule.kt",
    "before": "45c55cd723510176b0dad0e3189e5196a33b963a233e3be400f8f95c8296be32",
    "after": "b679e6014c5ff5431c23fc87d69adfb87673fae081a279f94471f530c50844ca",
    "changes": [
      [
        "      pendingMediaPickingResult = null\n\n      mediaHandler.readExtras(bareResult, options)",
        "      pendingMediaPickingResult = null\n\n      // Resume editing as well as decoding when camera/library outlives the process.\n      launchContract({ ImagePickerContractResult.Success(bareResult) }, options)"
      ],
      [
        "        CropImageContract(this@ImagePickerModule)\n      ) { input, result -> handleResultUponActivityDestruction(result, input.options) }",
        "        CropImageContract(this@ImagePickerModule)\n      ) { input, result ->\n        // This result has already passed through the crop editor.\n        input.options.allowsEditing = false\n        handleResultUponActivityDestruction(result, input.options)\n      }"
      ]
    ]
  }
];

function applyPickerCompatibility(projectRoot) {
  const updates = patches.map(patch => {
    const packageFile = require.resolve(patch.package + '/package.json', { paths: [projectRoot] });
    if (JSON.parse(fs.readFileSync(packageFile, 'utf8')).version !== patch.version) throw new Error('Review picker compatibility for updated ' + patch.package);
    const target = path.join(path.dirname(packageFile), patch.file);
    const current = fs.readFileSync(target, 'utf8');
    if (digest(current) === patch.after) return null;
    if (digest(current) !== patch.before) throw new Error('Unexpected picker dependency source: ' + patch.package);
    let next = current;
    for (const [before, after] of patch.changes) {
      if (next.split(before).length !== 2) throw new Error('Picker compatibility anchor differs');
      next = next.replace(before, after);
    }
    if (digest(next) !== patch.after) throw new Error('Picker compatibility output differs');
    return { target, next };
  });
  for (const update of updates) if (update) fs.writeFileSync(update.target, update.next);
}
module.exports = config => withDangerousMod(config, ['android', async config => {
  applyPickerCompatibility(config.modRequest.projectRoot);
  return config;
}]);
module.exports.applyPickerCompatibility = applyPickerCompatibility;
