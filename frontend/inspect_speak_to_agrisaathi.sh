#!/bin/bash

set -u
set -o pipefail

###############################################################################
# AgriSaathi - Speak to AgriSaathi Inspection
#
# PURPOSE
# -------
# Inspect the EXISTING AgriSaathi repository specifically for:
#
#   Speak to AgriSaathi
#       microphone
#       -> speech recognition
#       -> transcript
#       -> language detection
#       -> intent/entity extraction
#       -> structured retrieval
#       -> KCC Resource #26 retrieval
#       -> vector retrieval
#       -> authority ranking
#       -> freshness filtering
#       -> conflict detection
#       -> grounded generation
#       -> localization
#       -> transcript/answer
#       -> optional TTS
#
# IMPORTANT:
#   This script is INSPECTION ONLY.
#   It does NOT modify application source code.
#
# CRITICAL SEPARATION:
#
#   Speak to AgriSaathi != Agri Helper
#
# KCC Resource #26:
#   cef25fe2-9231-4128-8aec-2c948fedd43f
#
# MUST belong to Speak to AgriSaathi retrieval.
#
# It must NOT automatically be wired into:
#
#   /api/helper/chat
#
###############################################################################

###############################################################################
# 1. Repository root
###############################################################################

SCRIPT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$SCRIPT_DIR"

cd "$REPO_ROOT" || {
    echo "ERROR: Could not enter repository root."
    exit 1
}

###############################################################################
# 2. Configuration
###############################################################################

KCC_RESOURCE_ID="cef25fe2-9231-4128-8aec-2c948fedd43f"

INSPECTION_DIR="$REPO_ROOT/agrisaathi_speak_inspection"
TIMESTAMP="$(date '+%Y%m%d_%H%M%S')"
REPORT_FILE="$INSPECTION_DIR/speak_to_agrisaathi_report_${TIMESTAMP}.txt"

mkdir -p "$INSPECTION_DIR"

###############################################################################
# 3. Safety
###############################################################################

# Never allow generated inspection output to be scanned as application source.
#
# This is the critical fix for the infinite-loop problem.
#
# We also exclude:
#   node_modules
#   .git
#   build artifacts
#   caches
#   previous inspection output
#
EXCLUDE_DIRS=(
    "$REPO_ROOT/node_modules"
    "$REPO_ROOT/.git"
    "$REPO_ROOT/dist"
    "$REPO_ROOT/build"
    "$REPO_ROOT/.next"
    "$REPO_ROOT/.vite"
    "$REPO_ROOT/coverage"
    "$REPO_ROOT/.cache"
    "$REPO_ROOT/.turbo"
    "$INSPECTION_DIR"
)

###############################################################################
# 4. Logging
###############################################################################

exec > >(tee "$REPORT_FILE") 2>&1

section() {
    echo
    echo "======================================================================"
    echo "$1"
    echo "======================================================================"
}

###############################################################################
# 5. Safe file discovery
###############################################################################

find_source_files() {
    find "$REPO_ROOT" \
        -type d \( \
            -path "$REPO_ROOT/node_modules" -o \
            -path "$REPO_ROOT/.git" -o \
            -path "$REPO_ROOT/dist" -o \
            -path "$REPO_ROOT/build" -o \
            -path "$REPO_ROOT/.next" -o \
            -path "$REPO_ROOT/.vite" -o \
            -path "$REPO_ROOT/coverage" -o \
            -path "$REPO_ROOT/.cache" -o \
            -path "$REPO_ROOT/.turbo" -o \
            -path "$INSPECTION_DIR" \
        \) -prune -o \
        -type f \( \
            -name '*.js' -o \
            -name '*.jsx' -o \
            -name '*.ts' -o \
            -name '*.tsx' -o \
            -name '*.py' -o \
            -name '*.json' -o \
            -name '*.mjs' -o \
            -name '*.cjs' -o \
            -name '*.sql' -o \
            -name '*.md' -o \
            -name '*.env.example' -o \
            -name 'Dockerfile' -o \
            -name 'docker-compose.yml' -o \
            -name 'docker-compose.yaml' \
        \) -print
}

###############################################################################
# 6. Safe text search
###############################################################################

search_source() {
    local pattern="$1"

    grep -RInE \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=dist \
        --exclude-dir=build \
        --exclude-dir=.next \
        --exclude-dir=.vite \
        --exclude-dir=coverage \
        --exclude-dir=.cache \
        --exclude-dir=.turbo \
        --exclude='*.lock' \
        --exclude='package-lock.json' \
        --exclude='pnpm-lock.yaml' \
        --exclude='yarn.lock' \
        --exclude='speak_to_agrisaathi_report_*.txt' \
        -- "$pattern" "$REPO_ROOT" 2>/dev/null || true
}

###############################################################################
# 7. Header
###############################################################################

section "1. INSPECTION START"

echo "Repository:"
echo "$REPO_ROOT"

echo
echo "Inspection directory:"
echo "$INSPECTION_DIR"

echo
echo "Report:"
echo "$REPORT_FILE"

echo
echo "KCC Resource #26:"
echo "$KCC_RESOURCE_ID"

echo
echo "Timestamp:"
date

###############################################################################
# 8. Git state
###############################################################################

section "2. GIT / REPOSITORY STATE"

if command -v git >/dev/null 2>&1 && [ -d "$REPO_ROOT/.git" ]; then
    echo "Git repository: YES"

    echo
    echo "Current branch:"
    git branch --show-current 2>/dev/null || true

    echo
    echo "Git status:"
    git status --short 2>/dev/null || true
else
    echo "Git repository: NOT_DETECTED"
fi

###############################################################################
# 9. Top-level structure
###############################################################################

section "3. TOP-LEVEL REPOSITORY STRUCTURE"

find "$REPO_ROOT" \
    -maxdepth 2 \
    -mindepth 1 \
    -type d \
    ! -path "$INSPECTION_DIR" \
    ! -path "$REPO_ROOT/node_modules*" \
    ! -path "$REPO_ROOT/.git*" \
    ! -path "$REPO_ROOT/dist*" \
    ! -path "$REPO_ROOT/build*" \
    ! -path "$REPO_ROOT/.next*" \
    ! -path "$REPO_ROOT/.vite*" \
    ! -path "$REPO_ROOT/coverage*" \
    ! -path "$REPO_ROOT/.cache*" \
    ! -path "$REPO_ROOT/.turbo*" \
    2>/dev/null | sort | head -300

###############################################################################
# 10. Package files
###############################################################################

section "4. PACKAGE / PROJECT CONFIGURATION"

for file in \
    package.json \
    pnpm-workspace.yaml \
    turbo.json \
    vite.config.js \
    vite.config.ts \
    next.config.js \
    next.config.mjs \
    next.config.ts \
    tsconfig.json \
    jsconfig.json \
    requirements.txt \
    pyproject.toml \
    poetry.lock \
    Dockerfile \
    docker-compose.yml \
    docker-compose.yaml
do
    if [ -f "$REPO_ROOT/$file" ]; then
        echo
        echo "----- $file -----"
        sed -n '1,260p' "$REPO_ROOT/$file"
    fi
done

###############################################################################
# 11. Frontend framework
###############################################################################

section "5. FRONTEND FRAMEWORK DETECTION"

echo "React references:"
search_source 'from ["'\'']react["'\'']|require\(.*react'

echo
echo "Vite:"
search_source 'vite'

echo
echo "Next.js:"
search_source 'next/|next.config|NextRequest|NextResponse'

echo
echo "React Router:"
search_source 'react-router|BrowserRouter|Routes|Route|useNavigate|useLocation'

###############################################################################
# 12. Backend framework
###############################################################################

section "6. BACKEND FRAMEWORK DETECTION"

echo "FastAPI:"
search_source 'FastAPI|APIRouter|@app\.(get|post|put|delete)|@router\.(get|post|put|delete)'

echo
echo "Express:"
search_source 'express\(|app\.(get|post|put|delete)|Router\('

echo
echo "Flask:"
search_source 'Flask\(|@app\.route'

echo
echo "Django:"
search_source 'django|urlpatterns|APIView'

###############################################################################
# 13. Speak UI
###############################################################################

section "7. SPEAK TO AGRISAATHI UI"

search_source \
    'Speak to AgriSaathi|Speak to AgriSaathi|Tap and speak|Tap to speak|microphone|Microphone|mic|Mic|voice-first|voice query|speech'

###############################################################################
# 14. Speak component candidates
###############################################################################

section "8. SPEAK COMPONENT FILE CANDIDATES"

find_source_files | while IFS= read -r file; do
    case "$(basename "$file" | tr '[:upper:]' '[:lower:]')" in
        *speak*|*voice*|*speech*|*microphone*|*mic*|*assistant*)
            echo "$file"
            ;;
    esac
done

###############################################################################
# 15. Voice state machine
###############################################################################

section "9. SPEAK STATE MACHINE"

search_source \
    'idle|listening|transcribing|understanding|retrieving|generating|responding|speaking|error'

echo
echo "Voice-related state variables:"
search_source \
    'isListening|isRecording|isSpeaking|isTranscribing|isProcessing|transcript|recording|recognition'

###############################################################################
# 16. Browser speech recognition
###############################################################################

section "10. SPEECH RECOGNITION IMPLEMENTATION"

search_source \
    'SpeechRecognition|webkitSpeechRecognition|speechRecognition|recognition\.start|recognition\.stop|MediaRecorder|getUserMedia|audio'

###############################################################################
# 17. STT providers
###############################################################################

section "11. STT PROVIDERS / SPEECH-TO-TEXT"

search_source \
    'STT_API_KEY|SPEECH|TRANSCRIB|WHISPER|Deepgram|AssemblyAI|Google.*Speech|Azure.*Speech|speech-to-text|speech_to_text|transcription'

###############################################################################
# 18. TTS providers
###############################################################################

section "12. TTS PROVIDERS / TEXT-TO-SPEECH"

search_source \
    'TTS_API_KEY|TEXT.*SPEECH|SPEAK|speechSynthesis|Audio\(|ElevenLabs|Google.*Text.*Speech|Azure.*Speech|text-to-speech|text_to_speech'

###############################################################################
# 19. Speak API routes
###############################################################################

section "13. SPEAK-RELATED API ROUTES"

search_source \
    '/api/speak|/api/voice|/api/speech|/api/transcrib|/api/stt|/api/tts|/api/knowledge|/api/rag|/api/query|/api/agri'

###############################################################################
# 20. Agri Helper separation
###############################################################################

section "14. AGRI HELPER IMPLEMENTATION"

search_source \
    '/api/helper/chat|Agri Helper|AgriHelper|agri helper|helper/chat|helper'

###############################################################################
# 21. Critical separation test
###############################################################################

section "15. CRITICAL SPEAK / AGRI HELPER SEPARATION"

echo "Checking whether Speak to AgriSaathi references /api/helper/chat:"
search_source \
    '/api/helper/chat|helper/chat'

echo
echo "Checking whether Speak components import/reference helper implementation:"
search_source \
    'AgriHelper|Agri Helper|helperChat|helper/chat'

echo
echo "INTERPRETATION:"
echo "The above matches require manual inspection."
echo "A match does NOT automatically mean the architectures are incorrectly coupled."
echo "The final implementation must ensure:"
echo
echo "Speak to AgriSaathi:"
echo "  voice agricultural knowledge/query pipeline"
echo
echo "Agri Helper:"
echo "  navigation/page-help/contextual assistance"
echo
echo "KCC #26:"
echo "  Speak to AgriSaathi knowledge source"
echo "  NOT Agri Helper identity/source"

###############################################################################
# 22. KCC Resource #26 exact ID
###############################################################################

section "16. KCC RESOURCE #26 EXACT ID SEARCH"

echo "Searching exact Resource #26 ID:"
echo "$KCC_RESOURCE_ID"

search_source "$KCC_RESOURCE_ID"

###############################################################################
# 23. KCC terminology
###############################################################################

section "17. KCC DATA MODEL / TERMINOLOGY"

search_source \
    'Kisan Call Centre|Kisan Call|KCC|farmers queries|farmers query|queries.*answers|queries and answers|KCC transcript|KCC transcripts'

###############################################################################
# 24. KCC API / ingestion
###############################################################################

section "18. KCC INGESTION / CONNECTOR IMPLEMENTATION"

search_source \
    'data\.gov\.in|data.gov.in|resource_id|resourceId|DATA_GOV|api.data.gov|KCC'

###############################################################################
# 25. Resource registry
###############################################################################

section "19. SOURCE REGISTRY"

search_source \
    'source_registry|sourceRegistry|SourceRegistry|resource_registry|resourceRegistry|ResourceRegistry|sources|resource_id|resourceId'

###############################################################################
# 26. RAG
###############################################################################

section "20. RAG IMPLEMENTATION"

search_source \
    'RAG|rag|retrieval|retriever|retrieve|chunk|chunks|embedding|embeddings|vector|vector_db|vectorDB|similarity|semantic search|knowledge base|knowledge_base'

###############################################################################
# 27. Vector databases
###############################################################################

section "21. VECTOR DATABASE / EMBEDDINGS"

search_source \
    'pgvector|Pinecone|Weaviate|Qdrant|Chroma|Milvus|FAISS|Supabase.*vector|vector database|VECTOR_DATABASE_URL|EMBEDDING_API_KEY'

###############################################################################
# 28. LLM providers
###############################################################################

section "22. LLM / GENERATION"

search_source \
    'LLM_API_KEY|OPENAI|OpenAI|Anthropic|Gemini|GoogleGenerativeAI|Groq|Mistral|llm|chat completion|generateText|generateObject'

###############################################################################
# 29. Structured retrieval
###############################################################################

section "23. STRUCTURED RETRIEVAL"

search_source \
    'SELECT |FROM |WHERE |Prisma|Drizzle|SQLAlchemy|SQLModel|Supabase|Postgres|PostgreSQL|MongoDB|Firestore|structured search'

###############################################################################
# 30. Language detection
###############################################################################

section "24. LANGUAGE DETECTION"

search_source \
    'language detection|languageDetection|detectLanguage|langdetect|franc|locale|languageCode|selectedLanguage|selected_language'

###############################################################################
# 31. Translation
###############################################################################

section "25. TRANSLATION / LOCALIZATION"

search_source \
    '/api/translate|translate|translation|localization|localise|locale|Telugu|తెలుగు|hi-IN|te-IN|ta-IN|kn-IN|ml-IN'

###############################################################################
# 32. Intent/entity extraction
###############################################################################

section "26. INTENT / ENTITY EXTRACTION"

search_source \
    'intent|entity|entities|entity extraction|intent classification|classification|agricultural intent|crop extraction|location extraction'

###############################################################################
# 33. Authority ranking
###############################################################################

section "27. SOURCE AUTHORITY / RANKING"

search_source \
    'authority_level|authorityLevel|authority|source ranking|sourceRanking|ranking|verified source|ICAR|KVK|Agricultural University|government source'

###############################################################################
# 34. Freshness
###############################################################################

section "28. FRESHNESS / TEMPORAL STATUS"

search_source \
    'freshness|freshness_policy|freshnessPolicy|temporal_status|temporalStatus|CURRENT|HISTORICAL|ARCHIVED|last_updated|lastUpdated|published_at|publishedAt'

###############################################################################
# 35. Conflict detection
###############################################################################

section "29. CONFLICT DETECTION"

search_source \
    'conflict|conflicting|evidence conflict|source conflict|recommendation conflict'

###############################################################################
# 36. Provenance
###############################################################################

section "30. PROVENANCE"

search_source \
    'provenance|source_id|sourceId|resource_id|resourceId|record_id|recordId|chunk_id|chunkId|content_hash|contentHash|retrieved_at|retrievedAt|version'

###############################################################################
# 37. Content hashing
###############################################################################

section "31. CONTENT HASHING / VERSIONING"

search_source \
    'content_hash|contentHash|sha256|SHA-256|createHash|hashlib|version|versioning|sync_history|syncHistory'

###############################################################################
# 38. Database entities
###############################################################################

section "32. KNOWLEDGE DATABASE ENTITIES"

search_source \
    'sources|source_documents|source_records|rag_chunks|embeddings|provenance|ingestion_jobs|ingestion_errors|sync_history|translations'

###############################################################################
# 39. Voice provider abstraction
###############################################################################

section "33. VOICE PROVIDER ABSTRACTION"

search_source \
    'VoiceProvider|SpeechRecognitionService|TextToSpeechService|VoiceService|STTService|TTSService'

###############################################################################
# 40. Transcript rendering
###############################################################################

section "34. TRANSCRIPT UI"

search_source \
    'transcript|Transcript|transcription|Transcription|userTranscript|assistantTranscript|conversation|messages'

###############################################################################
# 41. Optional response speech
###############################################################################

section "35. RESPONSE SPEECH"

search_source \
    'speakResponse|speak response|read aloud|readAloud|speechSynthesis|playAudio|audioUrl|audio_url|tts'

###############################################################################
# 42. Environment variables
###############################################################################

section "36. ENVIRONMENT VARIABLE REFERENCES"

search_source \
    'DATA_GOV_API_KEY|DATABASE_URL|VECTOR_DATABASE_URL|EMBEDDING_API_KEY|LLM_API_KEY|STT_API_KEY|TTS_API_KEY'

echo
echo "NOTE:"
echo "Environment values are NOT printed."

###############################################################################
# 43. Route map
###############################################################################

section "37. ROUTE DEFINITIONS"

search_source \
    'path=|path:|route=|route:|createBrowserRouter|createRoutesFromElements|Routes|<Route|router\.|app\.(get|post|put|delete)|APIRouter|include_router'

###############################################################################
# 44. Navigation references
###############################################################################

section "38. NAVIGATION REFERENCES"

search_source \
    'navigate\(|useNavigate|Link|NavLink|href=|window\.location|router\.push|router\.replace'

###############################################################################
# 45. Existing helper endpoint
###############################################################################

section "39. EXISTING AGRI HELPER ENDPOINT"

search_source '/api/helper/chat'

###############################################################################
# 46. Check KCC association with helper
###############################################################################

section "40. KCC + AGRI HELPER CROSS-REFERENCE"

echo "Searching files containing both KCC terminology and helper references."

find_source_files | while IFS= read -r file; do
    if grep -Eiq \
        'Kisan Call Centre|KCC|cef25fe2-9231-4128-8aec-2c948fedd43f' \
        "$file" 2>/dev/null; then

        if grep -Eiq \
            '/api/helper/chat|AgriHelper|Agri Helper|helper' \
            "$file" 2>/dev/null; then

            echo
            echo "POTENTIAL CROSS-LINK:"
            echo "$file"

            grep -Ein \
                'Kisan Call Centre|KCC|cef25fe2-9231-4128-8aec-2c948fedd43f|/api/helper/chat|AgriHelper|Agri Helper|helper' \
                "$file" 2>/dev/null | head -120
        fi
    fi
done

###############################################################################
# 47. Check KCC association with Speak
###############################################################################

section "41. KCC + SPEAK CROSS-REFERENCE"

echo "Searching files containing KCC Resource #26 and Speak/voice references."

find_source_files | while IFS= read -r file; do
    if grep -Eiq \
        'Kisan Call Centre|KCC|cef25fe2-9231-4128-8aec-2c948fedd43f' \
        "$file" 2>/dev/null; then

        if grep -Eiq \
            'Speak to AgriSaathi|speak|voice|speech|transcri|microphone|mic' \
            "$file" 2>/dev/null; then

            echo
            echo "KCC + SPEAK CANDIDATE:"
            echo "$file"

            grep -Ein \
                'Kisan Call Centre|KCC|cef25fe2-9231-4128-8aec-2c948fedd43f|Speak to AgriSaathi|speak|voice|speech|transcri|microphone|mic' \
                "$file" 2>/dev/null | head -160
        fi
    fi
done

###############################################################################
# 48. Tests
###############################################################################

section "42. TEST FILES"

find "$REPO_ROOT" \
    -type d \( \
        -path "$REPO_ROOT/node_modules" -o \
        -path "$REPO_ROOT/.git" -o \
        -path "$INSPECTION_DIR" \
        \) -prune -o \
    -type f \( \
        -name '*test*' -o \
        -name '*spec*' \
    \) -print 2>/dev/null | sort | head -500

###############################################################################
# 49. Existing scripts
###############################################################################

section "43. PACKAGE SCRIPTS"

if [ -f "$REPO_ROOT/package.json" ]; then
    if command -v node >/dev/null 2>&1; then
        node - <<'NODE'
const fs = require("fs");

try {
    const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    console.log(JSON.stringify(pkg.scripts || {}, null, 2));
} catch (error) {
    console.log("Could not parse package.json:", error.message);
}
NODE
    else
        echo "Node.js is not installed."
    fi
fi

###############################################################################
# 50. Source file inventory
###############################################################################

section "44. SOURCE FILE INVENTORY"

find_source_files | sort > "$INSPECTION_DIR/source_files_${TIMESTAMP}.txt"

echo "Source file inventory saved separately:"
echo "$INSPECTION_DIR/source_files_${TIMESTAMP}.txt"

echo
echo "Source file count:"
wc -l < "$INSPECTION_DIR/source_files_${TIMESTAMP}.txt"

###############################################################################
# 51. Report self-reference protection verification
###############################################################################

section "45. REPORT SELF-REFERENCE SAFETY CHECK"

echo "Inspection output directory:"
echo "$INSPECTION_DIR"

echo
echo "The following directory is explicitly excluded from scanning:"
echo "$INSPECTION_DIR"

echo
echo "Generated report:"
echo "$REPORT_FILE"

echo
echo "The inspection script does not scan its own generated report."

###############################################################################
# 52. Critical acceptance checklist
###############################################################################

section "46. SPEAK TO AGRISAATHI ACCEPTANCE CHECKLIST"

echo "[ ] Existing central Speak to AgriSaathi UI identified"
echo "[ ] Existing microphone implementation identified"
echo "[ ] Speech recognition implementation identified"
echo "[ ] Transcript implementation identified"
echo "[ ] Language detection identified"
echo "[ ] Intent extraction identified"
echo "[ ] Entity extraction identified"
echo "[ ] Structured retrieval identified"
echo "[ ] Vector retrieval identified"
echo "[ ] KCC Resource #26 identified"
echo "[ ] KCC Resource #26 connected to Speak pipeline"
echo "[ ] Authority ranking identified"
echo "[ ] Freshness filtering identified"
echo "[ ] Temporal status identified"
echo "[ ] Conflict detection identified"
echo "[ ] Grounded generation identified"
echo "[ ] Localization identified"
echo "[ ] Optional TTS identified"
echo "[ ] Provenance identified"
echo "[ ] Content hashing identified"
echo "[ ] Versioning identified"
echo "[ ] Agri Helper identified separately"
echo "[ ] /api/helper/chat identified separately"
echo "[ ] No unintended KCC -> Agri Helper connection"
echo "[ ] No Speak -> /api/helper/chat dependency"

###############################################################################
# 53. Explicit architecture
###############################################################################

section "47. REQUIRED FINAL ARCHITECTURE"

cat <<'ARCHITECTURE'

SPEAK TO AGRISAATHI
===================

Large central voice-first interface

microphone
    |
    v
SpeechRecognitionService
    |
    v
Transcript
    |
    v
Language Detection
    |
    v
Intent / Entity Extraction
    |
    +--------------------------+
    |                          |
    v                          v
Structured Retrieval       Vector Retrieval
    |                          |
    +------------+-------------+
                 |
                 v
       KCC Resource #26
       cef25fe2-9231-4128-8aec-2c948fedd43f
                 |
                 v
       Other Verified Sources
                 |
                 v
       Source Authority Ranking
                 |
                 v
       Freshness / Temporal Filter
                 |
                 v
       Conflict Detection
                 |
                 v
       Grounded Generation
                 |
                 v
       Localization
                 |
                 +-----------> Transcript / Answer
                 |
                 +-----------> Optional TTS


AGRI HELPER
===========

Floating assistant

/api/helper/chat

Responsible for:

navigation
route awareness
page explanation
page reading
form guidance
contextual help
application assistance

KCC Resource #26 MUST NOT become Agri Helper's knowledge identity.


SHARED INFRASTRUCTURE MAY INCLUDE:

authentication
translation
language services
voice providers
RAG infrastructure
source registry

BUT:

SPEAK TO AGRISAATHI != AGRI HELPER

They remain separate user experiences and responsibility boundaries.

ARCHITECTURE

###############################################################################
# 54. Final report
###############################################################################

section "48. INSPECTION COMPLETE"

echo
echo "Repository inspection completed."

echo
echo "Report:"
echo "$REPORT_FILE"

echo
echo "Source inventory:"
echo "$INSPECTION_DIR/source_files_${TIMESTAMP}.txt"

echo
echo "KCC Resource #26:"
echo "$KCC_RESOURCE_ID"

echo
echo "IMPORTANT:"
echo "This inspection script did not modify existing application source files."

echo
echo "The report must be reviewed before implementation."

echo
echo "DO NOT:"
echo "  - create a second Speak to AgriSaathi implementation"
echo "  - replace the existing application"
echo "  - route Speak to AgriSaathi through /api/helper/chat"
echo "  - make KCC Resource #26 an Agri Helper data source"
echo "  - treat historical KCC answers as automatically current recommendations"

echo
echo "DONE:"
date

echo
echo "======================================================================"
