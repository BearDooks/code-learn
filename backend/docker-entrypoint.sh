#!/bin/sh

# Run create_lessons.py if RUN_CREATE_LESSONS environment variable is set to 'true'
if [ "$RUN_CREATE_LESSONS" = "true" ]; then
  echo "Running create_lessons.py..."
  python create_lessons.py
  echo "create_lessons.py finished."
fi

# Execute the main command (uvicorn server)
exec "$@"