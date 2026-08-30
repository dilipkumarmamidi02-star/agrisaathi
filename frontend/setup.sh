cd ~/Downloads/agrisaathi/frontend

npm install vite-plugin-pwa -D

mkdir -p public/icons
cp ~/Downloads/manifest.webmanifest public/manifest.webmanifest

cp ~/Downloads/Login.jsx src/pages/Login.jsx
cp ~/Downloads/Register.jsx src/pages/Register.jsx
cp ~/Downloads/ProfileSettings.jsx src/pages/ProfileSettings.jsx

if ! grep -q "manifest.webmanifest" index.html; then
  sed -i.bak 's|</head>|  <link rel="manifest" href="/manifest.webmanifest" />\n  <meta name="theme-color" content="#16a34a" />\n</head>|' index.html
  rm -f index.html.bak
  echo "index.html updated."
else
  echo "index.html already links the manifest, skipped."
fi

echo ""
echo "Add this to your router (e.g. App.jsx) if not already there:"
echo '  import ProfileSettings from "./pages/ProfileSettings";'
echo '  <Route path="/profile" element={<ProfileSettings />} />'

echo ""
echo "Add the VitePWA plugin to vite.config.js:"
cat <<'CFG'

  import { VitePWA } from 'vite-plugin-pwa'

  export default defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: false,
        includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      }),
    ],
  })
CFG

mkdir -p firebase
cat > firebase/firestore.rules << 'RULES'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
  }
}
RULES

echo ""
echo "firebase/firestore.rules written. Deploy with:"
echo "  firebase deploy --only firestore:rules"

npm run build

echo ""
echo "Done. Run npm run preview, open it, check DevTools > Application > Manifest."
