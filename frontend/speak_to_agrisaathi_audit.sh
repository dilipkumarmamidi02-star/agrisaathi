#!/usr/bin/env bash

set -u
set -o pipefail

if [ -n "${BASH_VERSION:-}" ]; then
    set +H 2>/dev/null || true
fi

PROJECT="${PROJECT:-/Users/mamididilipkumar/Downloads/agrisaathi/frontend}"

SRC="$PROJECT/src"
CONFIG="$SRC/config"
LIB="$SRC/lib"
PAGES="$SRC/pages"
COMPONENTS="$SRC/components"
DATA="$SRC/data"
API="$SRC/api"

TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"

REPORT_DIR="$PROJECT/../agrisaathi_speak_inspection"
REPORT="$REPORT_DIR/speak_to_agrisaathi_audit_$TIMESTAMP.txt"

mkdir -p "$REPORT_DIR"

PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

print_header() {
    printf '\n============================================================\n'
    printf '%s\n' "$1"
    printf '============================================================\n'
}

pass() {
    PASS_COUNT=$((PASS_COUNT + 1))
    printf 'PASS: %s\n' "$1"
}

warn() {
    WARN_COUNT=$((WARN_COUNT + 1))
    printf 'WARN: %s\n' "$1"
}

fail() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf 'FAIL: %s\n' "$1"
}

info() {
    printf 'INFO: %s\n' "$1"
}

file_exists() {
    [ -f "$1" ]
}

dir_exists() {
    [ -d "$1" ]
}

contains() {
    local file="$1"
    local pattern="$2"

    [ -f "$file" ] || return 1

    LC_ALL=C grep -Fq -- "$pattern" "$file" 2>/dev/null
}

contains_regex() {
    local file="$1"
    local pattern="$2"

    [ -f "$file" ] || return 1

    LC_ALL=C grep -Eq -- "$pattern" "$file" 2>/dev/null
}

{
    printf '%s\n' '======================================================================'
    printf '%s\n' 'Speak to AgriSaathi — Implementation-Aware READ-ONLY Audit'
    printf '%s\n' '======================================================================'
    printf 'Audit time: %s\n' "$(date)"
    printf 'Project: %s\n' "$PROJECT"
    printf 'Source: %s\n' "$SRC"
    printf '%s\n\n' 'Mode: READ ONLY'
} > "$REPORT"

exec > >(tee -a "$REPORT") 2>&1

print_header "01. PROJECT EXISTENCE"

if dir_exists "$PROJECT"; then
    pass "Existing AgriSaathi frontend directory found: $PROJECT"
else
    fail "AgriSaathi frontend directory not found: $PROJECT"
    exit 1
fi

if dir_exists "$SRC"; then
    pass "Existing src directory found"
else
    fail "src directory missing"
fi

print_header "02. EXISTING APPLICATION IDENTITY"

PACKAGE_JSON="$PROJECT/package.json"

if file_exists "$PACKAGE_JSON"; then
    pass "Existing package.json found"

    if contains "$PACKAGE_JSON" '"name"'; then
        pass "Existing application package metadata found"
    else
        warn "package.json exists but application name was not detected"
    fi
else
    fail "package.json missing"
fi

print_header "03. SPEAK TO AGRISAATHI ROUTES"

ROUTE_FILE="$CONFIG/canonical-feature-routes.js"
HELPER_CONTEXT="$LIB/agriHelperContext.js"
HELPER_FEATURES="$LIB/agriHelperFeatures.js"

ROUTE_FOUND=0

if contains "$ROUTE_FILE" 'speakToAgriSaathi'; then
    pass "Canonical Speak to AgriSaathi route definition found"
    ROUTE_FOUND=1
fi

if contains "$HELPER_CONTEXT" 'speakToAgriSaathi'; then
    pass "Speak to AgriSaathi route/context mapping found"
    ROUTE_FOUND=1
fi

if contains "$HELPER_FEATURES" 'speakToAgriSaathi'; then
    pass "Speak to AgriSaathi feature definition found"
    ROUTE_FOUND=1
fi

if [ "$ROUTE_FOUND" -eq 0 ]; then
    fail "No Speak to AgriSaathi route implementation evidence found"
fi

print_header "04. VOICE-FIRST IMPLEMENTATION"

VOICE_FILES=(
    "$COMPONENTS/AgriHelperWidget.jsx"
    "$LIB/agriHelperContext.js"
    "$LIB/indianLanguages.js"
    "$LIB/voiceDataGov.js"
)

VOICE_EVIDENCE=0

for file in "${VOICE_FILES[@]}"; do
    if file_exists "$file"; then
        if contains "$file" 'SpeechRecognition' ||
           contains "$file" 'webkitSpeechRecognition' ||
           contains "$file" 'speechSynthesis' ||
           contains "$file" 'SpeechSynthesisUtterance'; then
            printf 'FOUND: %s\n' "$file"
            VOICE_EVIDENCE=1
        fi
    fi
done

if [ "$VOICE_EVIDENCE" -eq 1 ]; then
    pass "Browser speech recognition / speech synthesis implementation evidence found"
else
    warn "Voice implementation evidence not sufficiently established"
fi

print_header "05. INDIAN LANGUAGE SUPPORT"

LANG_FILE="$LIB/indianLanguages.js"

if file_exists "$LANG_FILE"; then
    pass "Indian language configuration file found"

    if contains "$LANG_FILE" 'en-IN'; then
        pass "Indian BCP-47 locale configuration found"
    else
        warn "Indian locale evidence not detected"
    fi
else
    warn "Indian language configuration file not found"
fi

print_header "06. API / BACKEND INTEGRATION"

ENDPOINT_FILE="$API/endpoints.js"

if file_exists "$ENDPOINT_FILE"; then
    pass "Existing API endpoint registry found"

    if contains "$ENDPOINT_FILE" '/api/helper/chat'; then
        pass "Agri Helper chat endpoint registered"
    else
        warn "Agri Helper chat endpoint not found in endpoint registry"
    fi
else
    warn "API endpoint registry not found"
fi

HELPER_ENDPOINT_FOUND=0

if dir_exists "$SRC"; then
    while IFS= read -r file; do
        if contains "$file" '/api/helper/chat'; then
            printf 'FOUND endpoint reference: %s\n' "$file"
            HELPER_ENDPOINT_FOUND=1
        fi
    done < <(
        find "$SRC" -type f \
            \( -name '*.js' -o -name '*.jsx' -o -name '*.ts' -o -name '*.tsx' \) \
            -print 2>/dev/null
    )
fi

if [ "$HELPER_ENDPOINT_FOUND" -eq 1 ]; then
    pass "Helper chat endpoint reference exists in source"
else
    warn "Could not establish helper endpoint usage from frontend source"
fi

print_header "07. ARCHITECTURE BOUNDARY"

if contains "$HELPER_CONTEXT" 'Speak to AgriSaathi is the separate voice-first agricultural question and answer system'; then
    pass "Explicit Speak to AgriSaathi / Agri Helper architectural distinction found"
else
    warn "Explicit architectural boundary statement not found"
fi

if contains "$HELPER_CONTEXT" 'Agri Helper'; then
    pass "Agri Helper context implementation found"
else
    warn "Agri Helper context implementation not clearly identified"
fi

print_header "08. KCC RESOURCE BOUNDARY"

KCC_ID='cef25fe2-9231-4128-8aec-2c948fedd43f'

KCC_FOUND=0

if dir_exists "$SRC"; then
    while IFS= read -r file; do
        if contains "$file" "$KCC_ID"; then
            printf 'KCC RESOURCE FOUND: %s\n' "$file"
            KCC_FOUND=1
        fi
    done < <(
        find "$SRC" -type f \
            \( -name '*.js' -o -name '*.jsx' -o -name '*.json' -o -name '*.ts' -o -name '*.tsx' \) \
            -print 2>/dev/null
    )
fi

if [ "$KCC_FOUND" -eq 1 ]; then
    pass "KCC Resource #26 ID found in existing source"
else
    warn "KCC Resource #26 ID was not found in frontend source"
fi

print_header "09. DATA.GOV.IN RESOURCE REGISTRY"

REGISTRY="$CONFIG/data-gov-72-registry.js"
RESOURCE_DATA="$DATA/dataGovResources.js"

if file_exists "$REGISTRY"; then
    pass "72-resource Data.gov.in registry found"
else
    fail "72-resource Data.gov.in registry missing"
fi

if file_exists "$RESOURCE_DATA"; then
    pass "Data.gov.in resource data file found"
else
    warn "Data.gov.in resource data file missing"
fi

RESOURCE_COUNT=0

if file_exists "$REGISTRY"; then
    RESOURCE_COUNT="$(
        grep -Eo 'id:[[:space:]]*["'\"']?[a-f0-9-]{36}' "$REGISTRY" 2>/dev/null |
        wc -l |
        tr -d ' '
    )"
fi

printf 'Detected registry UUID entries: %s\n' "$RESOURCE_COUNT"

if [ "$RESOURCE_COUNT" -ge 72 ]; then
    pass "At least 72 registry UUID entries detected"
elif [ "$RESOURCE_COUNT" -gt 0 ]; then
    warn "Registry exists but fewer than 72 UUID entries were detected by this heuristic"
else
    warn "Registry UUID count could not be established"
fi

print_header "10. REGISTRY AUTHORITY / SOURCE OF TRUTH"

AUTHORITY_FOUND=0

for file in \
    "$REGISTRY" \
    "$RESOURCE_DATA" \
    "$LIB/dataGov.js" \
    "$LIB/voiceDataGov.js"
do
    if file_exists "$file"; then
        if contains "$file" 'authoritative'; then
            printf 'Authority evidence: %s\n' "$file"
            AUTHORITY_FOUND=1
        fi
    fi
done

if [ "$AUTHORITY_FOUND" -eq 1 ]; then
    pass "Data.gov.in registry authority evidence found"
else
    warn "Explicit registry authority statement not found"
fi

print_header "11. FRESHNESS / TEMPORAL HANDLING"

TEMPORAL_FOUND=0

for file in \
    "$REGISTRY" \
    "$RESOURCE_DATA" \
    "$LIB/dataGov.js" \
    "$LIB/marketIntelligence.js" \
    "$LIB/agriHelperContext.js"
do
    if file_exists "$file"; then
        if contains "$file" 'CURRENT' ||
           contains "$file" 'HISTORICAL' ||
           contains "$file" 'temporal_status' ||
           contains "$file" 'freshness'; then
            printf 'Temporal evidence: %s\n' "$file"
            TEMPORAL_FOUND=1
        fi
    fi
done

if [ "$TEMPORAL_FOUND" -eq 1 ]; then
    pass "Current/historical/freshness handling evidence found"
else
    warn "Freshness/temporal handling not established"
fi

print_header "12. MARKET / MANDI DATA"

MARKET_FILE="$LIB/marketIntelligence.js"

if file_exists "$MARKET_FILE"; then
    pass "Market intelligence implementation found"

    if contains "$MARKET_FILE" 'Current Mandi Prices'; then
        pass "Current mandi price feature found"
    fi

    if contains "$MARKET_FILE" 'Current daily commodity prices'; then
        pass "Current commodity price description found"
    fi
else
    warn "Market intelligence implementation not found"
fi

print_header "13. WEATHER INTEGRATION"

WEATHER_FOUND=0

if contains "$API/endpoints.js" 'weatherCurrent'; then
    pass "Current weather API endpoint registered"
    WEATHER_FOUND=1
fi

if contains "$LIB/agriHelperContext.js" 'current weather'; then
    pass "Current weather context handling found"
    WEATHER_FOUND=1
fi

if [ "$WEATHER_FOUND" -eq 0 ]; then
    warn "Current weather implementation evidence not established"
fi

print_header "14. GROUNDING / RETRIEVAL"

GROUNDING_FOUND=0

GROUNDING_TERMS=(
    'retrieval'
    'grounded'
    'evidence'
    'source'
    'citation'
    'verified'
    'knowledge'
)

for file in \
    "$LIB/agriHelperContext.js" \
    "$LIB/voiceDataGov.js"
do
    if file_exists "$file"; then
        for term in "${GROUNDING_TERMS[@]}"; do
            if contains "$file" "$term"; then
                printf 'Grounding term "%s": %s\n' "$term" "$file"
                GROUNDING_FOUND=1
            fi
        done
    fi
done

if [ "$GROUNDING_FOUND" -eq 1 ]; then
    pass "Grounding/retrieval/evidence references found"
else
    warn "Grounding implementation evidence not established"
fi

print_header "15. SOURCE AUTHORITY / RANKING"

AUTHORITY_RANKING_FOUND=0

AUTHORITY_TERMS=(
    'authority_level'
    'authorityLevel'
    'sourceAuthority'
    'authority'
    'ICAR'
    'KVK'
    'Agricultural University'
    'government source'
    'verified source'
)

for file in \
    "$DATA/educational/README.md" \
    "$LIB/agriHelperContext.js" \
    "$LIB/voiceDataGov.js" \
    "$PAGES/Treatments.jsx"
do
    if file_exists "$file"; then
        for term in "${AUTHORITY_TERMS[@]}"; do
            if contains "$file" "$term"; then
                printf 'Authority evidence "%s": %s\n' "$term" "$file"
                AUTHORITY_RANKING_FOUND=1
            fi
        done
    fi
done

if [ "$AUTHORITY_RANKING_FOUND" -eq 1 ]; then
    pass "Source authority / ICAR / KVK evidence found"
else
    warn "Source authority ranking implementation not established"
fi

print_header "16. PROVENANCE"

PROVENANCE_FOUND=0

PROVENANCE_TERMS=(
    'provenance'
    'source_id'
    'sourceId'
    'resource_id'
    'resourceId'
    'record_id'
    'recordId'
    'chunk_id'
    'chunkId'
    'content_hash'
    'contentHash'
    'retrieved_at'
    'retrievedAt'
    'version'
)

if dir_exists "$SRC"; then
    while IFS= read -r file; do
        for term in "${PROVENANCE_TERMS[@]}"; do
            if contains "$file" "$term"; then
                printf 'Provenance evidence "%s": %s\n' "$term" "$file"
                PROVENANCE_FOUND=1
                break
            fi
        done
    done < <(
        find "$SRC" -type f \
            \( -name '*.js' -o -name '*.jsx' -o -name '*.json' -o -name '*.ts' -o -name '*.tsx' \) \
            -print 2>/dev/null
    )
fi

if [ "$PROVENANCE_FOUND" -eq 1 ]; then
    pass "Provenance/source identity references found"
else
    warn "Explicit provenance implementation not established"
fi

print_header "17. EVIDENCE CONFLICT HANDLING"

CONFLICT_FOUND=0

CONFLICT_TERMS=(
    'conflict'
    'conflicting'
    'evidence conflict'
    'source conflict'
    'recommendation conflict'
)

if dir_exists "$SRC"; then
    while IFS= read -r file; do
        for term in "${CONFLICT_TERMS[@]}"; do
            if contains "$file" "$term"; then
                printf 'Conflict evidence "%s": %s\n' "$term" "$file"
                CONFLICT_FOUND=1
                break
            fi
        done
    done < <(
        find "$SRC" -type f \
            \( -name '*.js' -o -name '*.jsx' -o -name '*.json' -o -name '*.ts' -o -name '*.tsx' \) \
            -print 2>/dev/null
    )
fi

if [ "$CONFLICT_FOUND" -eq 1 ]; then
    pass "Evidence/source conflict handling reference found"
else
    warn "Explicit evidence conflict handling not established"
fi

print_header "18. TREATMENT SAFETY / CHEMICAL GUIDANCE"

TREATMENT_FILE="$PAGES/Treatments.jsx"

if file_exists "$TREATMENT_FILE"; then
    pass "Treatment page exists"

    if contains "$TREATMENT_FILE" 'active ingredient'; then
        pass "Active ingredient requirement found"
    else
        warn "Active ingredient requirement not found"
    fi

    if contains "$TREATMENT_FILE" 'application method'; then
        pass "Application method requirement found"
    else
        warn "Application method requirement not found"
    fi

    if contains "$TREATMENT_FILE" 'safety precautions'; then
        pass "Safety precautions requirement found"
    else
        warn "Safety precautions requirement not found"
    fi

    if contains "$TREATMENT_FILE" 'pre-harvest interval'; then
        pass "Pre-harvest interval requirement found"
    else
        warn "Pre-harvest interval requirement not found"
    fi

    if contains "$TREATMENT_FILE" 'Never recommend banned substances'; then
        pass "Banned-substance safety instruction found"
    else
        warn "Banned-substance safety instruction not found"
    fi

    if contains "$TREATMENT_FILE" 'Never recommend' ||
       contains "$TREATMENT_FILE" 'invent dosages'; then
        pass "Dosage safety instruction found"
    else
        warn "Dosage safety instruction not established"
    fi
else
    warn "Treatments.jsx not found"
fi

print_header "19. OPTIONAL TEXT-TO-SPEECH"

TTS_FOUND=0

for file in \
    "$COMPONENTS/AgriHelperWidget.jsx" \
    "$LIB/indianLanguages.js"
do
    if file_exists "$file"; then
        if contains "$file" 'speechSynthesis' ||
           contains "$file" 'SpeechSynthesisUtterance'; then
            printf 'TTS evidence: %s\n' "$file"
            TTS_FOUND=1
        fi
    fi
done

if [ "$TTS_FOUND" -eq 1 ]; then
    pass "Optional browser TTS implementation found"
else
    warn "Optional TTS implementation not established"
fi

print_header "20. CANONICAL ROUTES"

if file_exists "$ROUTE_FILE"; then
    if contains "$ROUTE_FILE" 'speakToAgriSaathi: "/"'; then
        pass "Canonical Speak to AgriSaathi root route found"
    elif contains "$ROUTE_FILE" 'speakToAgriSaathi'; then
        pass "Canonical Speak to AgriSaathi route key found"
    else
        warn "Canonical Speak to AgriSaathi route key not found"
    fi
else
    warn "Canonical feature route file missing"
fi

print_header "21. PAGE ROUTER"

PAGE_ROUTER="$LIB/pageRouter.js"

if file_exists "$PAGE_ROUTER"; then
    pass "Existing page router found"

    if contains "$PAGE_ROUTER" 'Speak to AgriSaathi' ||
       contains "$PAGE_ROUTER" 'speak-to-agrisaathi' ||
       contains "$PAGE_ROUTER" '/speak'; then
        pass "Speak to AgriSaathi navigation evidence found"
    else
        warn "Speak to AgriSaathi navigation evidence not found"
    fi
else
    warn "pageRouter.js not found"
fi

print_header "22. AGRI HELPER CONTEXT"

if file_exists "$HELPER_CONTEXT"; then
    pass "Agri Helper context module found"

    if contains "$HELPER_CONTEXT" 'getCurrentFeatureFromPath'; then
        pass "Current-page feature context detection found"
    fi

    if contains "$HELPER_CONTEXT" 'selectedCommodity'; then
        pass "Current commodity context support found"
    fi

    if contains "$HELPER_CONTEXT" 'selectedCrop'; then
        pass "Current crop context support found"
    fi
else
    fail "agriHelperContext.js missing"
fi

print_header "23. VOICE DATA.GOV CONTEXT"

VOICE_DATAGOV="$LIB/voiceDataGov.js"

if file_exists "$VOICE_DATAGOV"; then
    pass "Voice Data.gov context module found"

    if contains "$VOICE_DATAGOV" 'Registry metadata remains authoritative'; then
        pass "Voice registry authority statement found"
    else
        warn "Voice registry authority statement not found"
    fi
else
    warn "voiceDataGov.js not found"
fi

print_header "24. EDUCATIONAL DATA PROVENANCE"

EDU_README="$DATA/educational/README.md"

if file_exists "$EDU_README"; then
    pass "Educational data README found"

    if contains "$EDU_README" 'authoritative provenance'; then
        pass "Educational data provenance requirement found"
    else
        warn "Educational provenance requirement not detected"
    fi

    if contains "$EDU_README" 'authority_level'; then
        pass "Educational authority-level metadata documented"
    else
        warn "Educational authority-level metadata not documented"
    fi
else
    warn "Educational README not found"
fi

print_header "25. READ-ONLY SAFETY CHECK"

info "Audit does not invoke npm build/install/start."
info "Audit does not modify source files."
info "Audit does not perform database writes."
info "Audit only reads project files and writes an external audit report."

pass "Audit execution path is READ ONLY with respect to AgriSaathi source"

print_header "26. BUILD STATUS"

info "Build execution intentionally skipped because this audit is READ ONLY."
info "Use the existing recorded build result if available."

BUILD_REPORT_FOUND=0

for file in "$PROJECT"/../agrisaathi_speak_inspection/speak_to_agrisaathi_report_*.txt
do
    if file_exists "$file"; then
        if contains "$file" 'npm run build succeeded'; then
            pass "Existing audit report records successful frontend build"
            BUILD_REPORT_FOUND=1
            break
        fi
    fi
done

if [ "$BUILD_REPORT_FOUND" -eq 0 ]; then
    warn "No existing recorded successful build result was found"
fi

print_header "27. ARCHITECTURE BOUNDARY"

printf '%s\n' 'Speak to AgriSaathi != Agri Helper'
printf '%s\n' ''
printf '%s\n' 'Speak to AgriSaathi:'
printf '%s\n' '  Voice-first agricultural knowledge/query interface'
printf '%s\n' ''
printf '%s\n' 'Agri Helper:'
printf '%s\n' '  Floating application/navigation assistant'
printf '%s\n' ''
printf '%s\n' 'Agri Helper endpoint:'
printf '%s\n' '  /api/helper/chat'
printf '%s\n' ''
printf '%s\n' 'KCC Resource #26:'
printf '%s\n' "  $KCC_ID"
printf '%s\n' ''
printf '%s\n' 'KCC MUST belong to Speak to AgriSaathi knowledge retrieval.'
printf '%s\n' "KCC MUST NOT become Agri Helper's knowledge identity."
printf '%s\n' ''
printf '%s\n' 'TEST MODE:'
printf '%s\n' '  READ ONLY'

print_header "FINAL RESULT"

printf 'PASS COUNT : %s\n' "$PASS_COUNT"
printf 'WARN COUNT : %s\n' "$WARN_COUNT"
printf 'FAIL COUNT : %s\n' "$FAIL_COUNT"
printf '\n'

if [ "$FAIL_COUNT" -eq 0 ]; then
    printf '%s\n' 'RESULT: PASS'
    printf '%s\n' 'No hard integration failure was detected.'
else
    printf '%s\n' 'RESULT: FAIL'
    printf '%s\n' 'One or more required implementation checks failed.'
fi

printf '\n'
printf '%s\n' 'Warnings still require engineering review.'
printf '\n'
printf '%s\n' '======================================================================'
printf '%s\n' 'TEST COMPLETE'
printf '%s\n' '======================================================================'
printf 'Report: %s\n' "$REPORT"
