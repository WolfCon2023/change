#!/bin/bash

# Railway start script for monorepo
# Set SERVICE_TYPE environment variable to 'api' or 'web'

if [ "$SERVICE_TYPE" = "web" ]; then
  echo "Starting Web service..."
  npx serve -s apps/web/dist -l ${PORT:-3000}
else
  echo "Starting API service..."
  node apps/api/dist/index.js
fi
