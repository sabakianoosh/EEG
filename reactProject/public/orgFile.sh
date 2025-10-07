#!/bin/bash

# Check if a folder name was provided
if [ -z "$1" ]; then
    echo "Usage: $0 <folder_name>"
    exit 1
fi

# Input folder name
FOLDER_NAME="$1"

# Create the folder if it doesn’t exist
mkdir -p "$FOLDER_NAME"

# List of files to move
FILES=("brainwaves.csv" "attention.csv" "meditation.csv")

# Move the files into the folder
for FILE in "${FILES[@]}"; do
    if [ -f "$FILE" ]; then
        mv "$FILE" "$FOLDER_NAME/"
        echo "Moved $FILE → $FOLDER_NAME/"
    else
        echo "Warning: $FILE not found."
    fi
done

echo "✅ Done."
