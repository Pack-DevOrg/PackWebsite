# Universal Links Configuration

This directory contains configuration files for iOS Universal Links and Android App Links.

## Files

- `apple-app-site-association` - iOS Universal Links configuration (AASA file)
- `assetlinks.json` - Android App Links configuration

## ⚠️ CRITICAL: Before Deployment

### iOS (apple-app-site-association)

1. **Replace TEAM_ID** with your actual Apple Developer Team ID
   - Find it in: Apple Developer Account → Membership → Team ID
   - Example: `9JA89QQLNQ.com.doneai.app`

2. **Validation**
   - Use Apple's AASA Validator: https://search.developer.apple.com/appsearch-validation-tool/
   - Test locally with developer mode: Add `?mode=developer` to your domain in Xcode

3. **Important Notes**
   - File has NO extension
   - Must be served as `Content-Type: application/json`
   - Must be HTTPS only
   - Apple caches this file on CDN - changes require app update via App Store
   - Uses modern iOS 13+ format with `appIDs` (plural) and `components`

### Android (assetlinks.json)

1. **Replace SHA256_FINGERPRINT_HERE** with your app's certificate fingerprint
   - **For Play Store apps**: Use the fingerprint from Google Play Console
     - Go to: Play Console → Release → Setup → App signing
     - Copy the "SHA-256 certificate fingerprint"
   - **For local testing**: Use your debug keystore fingerprint
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - **IMPORTANT**: Use UPPERCASE letters for the fingerprint

2. **Multiple Fingerprints**
   - Add both debug and release fingerprints for testing:
   ```json
   "sha256_cert_fingerprints": [
     "RELEASE_FINGERPRINT_HERE",
     "DEBUG_FINGERPRINT_HERE"
   ]
   ```

3. **Validation**
   - Use Google's Digital Asset Links Tester: https://developers.google.com/digital-asset-links/tools/generator
   - Verify file is publicly accessible and returns HTTP 200

4. **Important Notes**
   - Must be served as `Content-Type: application/json`
   - Must be HTTPS only
   - Android verification can take 20+ seconds
   - No BOM (Byte Order Mark) in UTF-8 encoding

## Testing

### iOS Testing
1. Build and install app on physical device
2. Send yourself a test link via Messages or Mail
3. Long-press the link - should show "Open in [App Name]"
4. Tap link - should open app directly

### Android Testing
1. Build and install app on physical device
2. Clear app data to reset verification state
3. Open link in browser - should show "Open in app" prompt
4. Verify in Settings → Apps → [App Name] → Open by default

## Troubleshooting

### iOS Issues
- **Link doesn't open app**:
  - Verify TEAM_ID is correct
  - Check AASA file is accessible at https://yourdomain.com/.well-known/apple-app-site-association
  - Force re-download: Uninstall app, restart device, reinstall

### Android Issues
- **Link opens in browser**:
  - Verify SHA256 fingerprint is correct and UPPERCASE
  - Check package name matches exactly
  - Wait 20+ seconds after app installation
  - Clear app data and try again

## Best Practices (2025)

1. **Always use HTTPS** - Universal/App Links require secure connections
2. **No redirects** - Serve files directly with HTTP 200
3. **Use developer mode** during testing to avoid Apple's CDN caching
4. **Version control** - Keep history of changes for rollback capability
5. **Regular validation** - Use official tools to verify configuration
6. **Update with app releases** - iOS requires app updates for AASA changes

## Resources

- [iOS Universal Links Guide](https://developer.apple.com/ios/universal-links/)
- [Android App Links Guide](https://developer.android.com/training/app-links)
- [AASA Validator](https://search.developer.apple.com/appsearch-validation-tool/)
- [Digital Asset Links Tester](https://developers.google.com/digital-asset-links/tools/generator)
