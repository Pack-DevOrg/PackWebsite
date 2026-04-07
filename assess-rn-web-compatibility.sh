#!/bin/bash

# React Native Web Compatibility Assessment Script
# Run this in your PackApp mobile app directory to assess web migration feasibility

set -e

echo "=================================================="
echo "React Native Web Compatibility Assessment"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a React Native project
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found${NC}"
    echo "Please run this script from your React Native mobile app directory"
    exit 1
fi

echo -e "${BLUE}📦 Analyzing package.json...${NC}"
echo ""

# Check if using Expo
if grep -q "expo" package.json; then
    echo -e "${GREEN}✅ Expo detected${NC}"
    EXPO_VERSION=$(grep '"expo"' package.json | sed -E 's/.*"([0-9]+\.[0-9]+\.[0-9]+)".*/\1/')
    echo "   Expo version: $EXPO_VERSION"
    if [ ! -z "$EXPO_VERSION" ]; then
        MAJOR_VERSION=$(echo $EXPO_VERSION | cut -d. -f1)
        if [ "$MAJOR_VERSION" -ge 50 ]; then
            echo -e "${GREEN}   ✅ Expo SDK $MAJOR_VERSION has excellent web support${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Expo SDK $MAJOR_VERSION has limited web support. Consider upgrading to SDK 50+${NC}"
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Expo not detected (bare React Native)${NC}"
    echo "   Web migration will be more complex without Expo"
fi
echo ""

# Check for React Native Web
if grep -q "react-native-web" package.json; then
    echo -e "${GREEN}✅ react-native-web already installed${NC}"
else
    echo -e "${YELLOW}⚠️  react-native-web not installed${NC}"
    echo "   Run: npx expo install react-native-web react-dom"
fi
echo ""

# Check dependencies
echo -e "${BLUE}🔍 Analyzing dependencies for web compatibility...${NC}"
echo ""

# Problematic native modules
echo "Checking for potentially problematic native modules:"
PROBLEMATIC_MODULES=(
    "expo-calendar"
    "expo-contacts"
    "expo-camera"
    "expo-barcode-scanner"
    "expo-local-authentication"
    "expo-sensors"
    "react-native-maps"
    "react-native-camera"
    "react-native-vision-camera"
    "@react-native-community/geolocation"
    "react-native-biometrics"
)

FOUND_PROBLEMATIC=0
for module in "${PROBLEMATIC_MODULES[@]}"; do
    if grep -q "\"$module\"" package.json; then
        echo -e "${RED}   ❌ $module${NC} - No web support"
        FOUND_PROBLEMATIC=1
    fi
done

if [ $FOUND_PROBLEMATIC -eq 0 ]; then
    echo -e "${GREEN}   ✅ No known problematic modules found${NC}"
fi
echo ""

# Web-compatible modules
echo "Checking for web-compatible modules:"
WEB_COMPATIBLE=(
    "zustand"
    "@tanstack/react-query"
    "react-query"
    "axios"
    "swr"
    "aws-amplify"
    "@aws-amplify"
    "react-hook-form"
    "formik"
    "yup"
    "zod"
)

FOUND_COMPATIBLE=0
for module in "${WEB_COMPATIBLE[@]}"; do
    if grep -q "\"$module\"" package.json; then
        echo -e "${GREEN}   ✅ $module${NC}"
        FOUND_COMPATIBLE=1
    fi
done

if [ $FOUND_COMPATIBLE -eq 0 ]; then
    echo "   No specifically web-compatible modules detected"
fi
echo ""

# Partially compatible modules (need platform-specific code)
echo "Checking for modules that need platform-specific code:"
PARTIAL_MODULES=(
    "expo-notifications"
    "expo-file-system"
    "expo-secure-store"
    "@react-native-async-storage/async-storage"
    "expo-location"
    "react-native-reanimated"
)

FOUND_PARTIAL=0
for module in "${PARTIAL_MODULES[@]}"; do
    if grep -q "\"$module\"" package.json; then
        echo -e "${YELLOW}   ⚠️  $module${NC} - Needs platform-specific implementation"
        FOUND_PARTIAL=1
    fi
done

if [ $FOUND_PARTIAL -eq 0 ]; then
    echo "   No partially compatible modules found"
fi
echo ""

# Check navigation
echo -e "${BLUE}🧭 Checking navigation setup...${NC}"
if grep -q "expo-router" package.json; then
    echo -e "${GREEN}✅ Expo Router detected - excellent web support${NC}"
elif grep -q "@react-navigation" package.json; then
    echo -e "${YELLOW}⚠️  React Navigation detected - has web support but Expo Router recommended${NC}"
else
    echo "   No known navigation library detected"
fi
echo ""

# Check for platform-specific files
echo -e "${BLUE}📱 Scanning for platform-specific files...${NC}"
if [ -d "src" ] || [ -d "app" ]; then
    IOS_FILES=$(find . -name "*.ios.*" 2>/dev/null | wc -l)
    ANDROID_FILES=$(find . -name "*.android.*" 2>/dev/null | wc -l)
    WEB_FILES=$(find . -name "*.web.*" 2>/dev/null | wc -l)

    echo "   iOS-specific files: $IOS_FILES"
    echo "   Android-specific files: $ANDROID_FILES"
    echo "   Web-specific files: $WEB_FILES"

    TOTAL_PLATFORM_FILES=$((IOS_FILES + ANDROID_FILES + WEB_FILES))
    if [ $TOTAL_PLATFORM_FILES -gt 0 ]; then
        echo -e "${YELLOW}   ⚠️  Platform-specific code detected (expected for web migration)${NC}"
    else
        echo -e "${GREEN}   ✅ No platform-specific files found yet${NC}"
    fi
else
    echo "   Could not find src/ or app/ directory"
fi
echo ""

# Check for Platform.OS usage
echo -e "${BLUE}🔧 Checking for Platform.OS usage...${NC}"
if [ -d "src" ] || [ -d "app" ]; then
    PLATFORM_USAGE=$(grep -r "Platform\.OS" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | wc -l)
    echo "   Found $PLATFORM_USAGE instances of Platform.OS"

    if [ $PLATFORM_USAGE -eq 0 ]; then
        echo -e "${GREEN}   ✅ No platform-specific code detected${NC}"
    else
        echo -e "${YELLOW}   ⚠️  These will need review for web compatibility${NC}"
        echo ""
        echo "   Top 5 files with Platform.OS usage:"
        grep -r "Platform\.OS" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . 2>/dev/null | \
            cut -d: -f1 | sort | uniq -c | sort -rn | head -5 | \
            while read count file; do
                echo "      $count instances in $file"
            done
    fi
fi
echo ""

# Check for web build configuration
echo -e "${BLUE}⚙️  Checking build configuration...${NC}"
if [ -f "app.json" ]; then
    if grep -q "\"web\"" app.json; then
        echo -e "${GREEN}✅ Web configuration found in app.json${NC}"
    else
        echo -e "${YELLOW}⚠️  No web configuration in app.json${NC}"
        echo "   You'll need to add web platform configuration"
    fi
fi
if [ -f "webpack.config.js" ]; then
    echo -e "${GREEN}✅ Custom webpack.config.js found${NC}"
fi
if [ -f "metro.config.js" ]; then
    echo -e "${GREEN}✅ Metro config found${NC}"
fi
echo ""

# Generate summary report
echo "=================================================="
echo -e "${BLUE}📊 COMPATIBILITY SUMMARY${NC}"
echo "=================================================="
echo ""

# Calculate compatibility score
SCORE=100

if ! grep -q "expo" package.json; then
    SCORE=$((SCORE - 20))
    echo -e "${RED}[-20] Not using Expo (migration harder)${NC}"
fi

if [ $FOUND_PROBLEMATIC -eq 1 ]; then
    SCORE=$((SCORE - 30))
    echo -e "${RED}[-30] Problematic native modules detected${NC}"
fi

if [ $FOUND_PARTIAL -eq 1 ]; then
    SCORE=$((SCORE - 15))
    echo -e "${YELLOW}[-15] Modules requiring platform-specific code${NC}"
fi

if [ $PLATFORM_USAGE -gt 20 ]; then
    SCORE=$((SCORE - 10))
    echo -e "${YELLOW}[-10] Significant platform-specific code${NC}"
fi

if ! grep -q "react-native-web" package.json; then
    SCORE=$((SCORE - 5))
    echo -e "${YELLOW}[-5] React Native Web not installed${NC}"
fi

echo ""
echo "=================================================="
echo -e "${BLUE}OVERALL COMPATIBILITY SCORE: $SCORE/100${NC}"
echo "=================================================="
echo ""

if [ $SCORE -ge 80 ]; then
    echo -e "${GREEN}✅ EXCELLENT - Web migration should be straightforward${NC}"
    echo "Estimated effort: 3-5 weeks"
elif [ $SCORE -ge 60 ]; then
    echo -e "${YELLOW}⚠️  GOOD - Web migration feasible with some work${NC}"
    echo "Estimated effort: 6-8 weeks"
elif [ $SCORE -ge 40 ]; then
    echo -e "${YELLOW}⚠️  MODERATE - Web migration will require significant effort${NC}"
    echo "Estimated effort: 8-12 weeks"
else
    echo -e "${RED}❌ CHALLENGING - Consider separate web app or major refactoring${NC}"
    echo "Estimated effort: 3-6 months"
fi
echo ""

# Recommendations
echo "=================================================="
echo -e "${BLUE}📋 RECOMMENDED NEXT STEPS${NC}"
echo "=================================================="
echo ""
echo "1. Install web dependencies:"
echo "   npx expo install react-native-web react-dom @expo/metro-runtime"
echo ""
echo "2. Test basic web build:"
echo "   npx expo start --web"
echo ""
echo "3. Review detailed assessment:"
echo "   Read REACT_NATIVE_WEB_ASSESSMENT.md for complete migration plan"
echo ""
echo "4. Create abstraction layers for:"
if [ $FOUND_PARTIAL -eq 1 ]; then
    echo "   - Storage (FileSystem → IndexedDB)"
    echo "   - Notifications (Expo → Web Push)"
    echo "   - Authentication (OAuth redirect URLs)"
fi
echo ""
echo "5. Set up platform-specific implementations:"
echo "   - Create .web.tsx files for incompatible modules"
echo "   - Use Platform.select() for configuration differences"
echo ""

# Save report
REPORT_FILE="web-compatibility-report.txt"
{
    echo "React Native Web Compatibility Report"
    echo "Generated: $(date)"
    echo ""
    echo "Compatibility Score: $SCORE/100"
    echo ""
    echo "Dependencies requiring attention:"
    for module in "${PROBLEMATIC_MODULES[@]}"; do
        if grep -q "\"$module\"" package.json; then
            echo "  - $module (no web support)"
        fi
    done
    for module in "${PARTIAL_MODULES[@]}"; do
        if grep -q "\"$module\"" package.json; then
            echo "  - $module (needs platform code)"
        fi
    done
    echo ""
    echo "Platform-specific files: $TOTAL_PLATFORM_FILES"
    echo "Platform.OS usage count: $PLATFORM_USAGE"
} > "$REPORT_FILE"

echo -e "${GREEN}✅ Full report saved to: $REPORT_FILE${NC}"
echo ""
echo "=================================================="
echo "Assessment complete!"
echo "=================================================="
