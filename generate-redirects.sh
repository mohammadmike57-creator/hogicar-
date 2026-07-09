#!/bin/bash

# This script generates the _redirects file for Render static site hosting.
# It uses the VITE_API_URL environment variable if available, otherwise it uses a fallback.
# This prevents hardcoding the onrender.com domain in the codebase.

DESTINATION=${VITE_API_URL:-"https://hogicar-backend.onrender.com"}
REDIRECTS_FILE="public/_redirects"

echo "[REDIRECTS] Generating $REDIRECTS_FILE with destination: $DESTINATION"

cat <<EOF > $REDIRECTS_FILE
/sitemap.xml $DESTINATION/sitemap.xml 200
/sitemap-*.xml $DESTINATION/sitemap-*.xml 200
/robots.txt $DESTINATION/robots.txt 200
/api/* $DESTINATION/api/* 200
/* /index.html 200
EOF

echo "[REDIRECTS] Done."
