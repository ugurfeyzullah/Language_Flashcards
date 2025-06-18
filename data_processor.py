#!/usr/bin/env python3
"""
Data processor for the Language Flash Cards application.
Converts Excel data into JSON format for the web app.
"""

import pandas as pd
import json
import os
from pathlib import Path

class FlashCardDataProcessor:
    def __init__(self, excel_path, audio_dir, images_dir, output_dir):
        self.excel_path = excel_path
        self.audio_dir = Path(audio_dir)
        self.images_dir = Path(images_dir)
        self.output_dir = Path(output_dir)
        
    def process_excel_data(self):
        """Process Excel file and convert to flashcard format."""
        try:
            # Read Excel file
            df = pd.read_excel(self.excel_path)
            print(f"Loaded {len(df)} words from Excel file")
            
            flashcards = []
            
            for index, row in df.iterrows():
                try:
                    # Create unique ID from the word
                    card_id = f"card_{index + 1}"
                    
                    # Extract data from row
                    english_word = str(row['Wort']).strip()
                    german_translation = str(row['Übersetzung']).strip()
                    level = str(row['Band']).strip() if pd.notna(row['Band']) else ""
                    sentence = str(row['Sentence']).strip() if pd.notna(row['Sentence']) else ""
                    pronunciation = str(row['Pronunciation']).strip() if pd.notna(row['Pronunciation']) else ""
                    
                    # Process audio file path
                    audio_filename = self._find_audio_file(german_translation)
                    audio_url = f"./word_audio/{audio_filename}" if audio_filename else None
                    
                    # Process image file path
                    image_filename = self._find_image_file(german_translation)
                    image_url = f"./word_images/{image_filename}" if image_filename else None
                      # Create flashcard object (German on front, English on back)
                    flashcard = {
                        "id": card_id,
                        "front": {
                            "primaryText": german_translation,  # German word on front
                            "secondaryText": f"{level} • {pronunciation}" if pronunciation else level,
                            "audioUrl": audio_url,
                            "imageUrl": image_url
                        },
                        "back": {
                            "translation": english_word,  # English translation on back
                            "example": sentence,
                            "notes": f"Level: {level}" if level else ""
                        },
                        "isFavourite": False,
                        "level": level
                    }
                    
                    flashcards.append(flashcard)
                    
                except Exception as e:
                    print(f"Error processing row {index}: {e}")
                    continue
            
            print(f"Successfully processed {len(flashcards)} flashcards")
            return flashcards
            
        except Exception as e:
            print(f"Error reading Excel file: {e}")
            return []
    
    def _find_audio_file(self, german_word):
        """Find corresponding audio file for a German word."""
        # Clean the German word for filename matching
        clean_word = self._clean_for_filename(german_word)
        
        # Common audio file patterns
        patterns = [
            f"{clean_word}_voice.mp3",
            f"{clean_word}.mp3",
        ]
        
        for pattern in patterns:
            audio_file = self.audio_dir / pattern
            if audio_file.exists():
                return pattern
        
        # If exact match not found, try to find partial matches
        for audio_file in self.audio_dir.glob("*.mp3"):
            if clean_word.lower() in audio_file.stem.lower():
                return audio_file.name
        
        return None
    
    def _find_image_file(self, german_word):
        """Find corresponding image file for a German word."""
        # Clean the German word for filename matching
        clean_word = self._clean_for_filename(german_word)
        
        # Common image file patterns
        extensions = ['.jpg', '.jpeg', '.png', '.gif']
        patterns = []
        
        for ext in extensions:
            patterns.extend([
                f"{clean_word}_photo{ext}",
                f"{clean_word}_icon{ext}",
                f"{clean_word}_designed{ext}",
                f"{clean_word}{ext}",
            ])
        
        for pattern in patterns:
            image_file = self.images_dir / pattern
            if image_file.exists():
                return pattern
        
        # If exact match not found, try to find partial matches
        for image_file in self.images_dir.glob("*"):
            if image_file.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
                if clean_word.lower() in image_file.stem.lower():
                    return image_file.name
        
        return None
    
    def _clean_for_filename(self, text):
        """Clean text to match filename patterns."""
        # Replace common characters that might be in filenames
        replacements = {
            ' ': '_',
            ',': '__',
            '/': '__',
            '(': '__',
            ')': '__',
            '[': '__',
            ']': '__',
            '{': '__',
            '}': '__',
            ':': '__',
            ';': '__',
            '!': '__',
            '?': '__',
            '"': '__',
            "'": '__',
            '`': '__',
            '~': '__',
            '@': '__',
            '#': '__',
            '$': '__',
            '%': '__',
            '^': '__',
            '&': '__',
            '*': '__',
            '+': '__',
            '=': '__',
            '|': '__',
            '\\': '__',
            '<': '__',
            '>': '__',
            '.': '__',
        }
        
        cleaned = text
        for old, new in replacements.items():
            cleaned = cleaned.replace(old, new)
        
        # Remove multiple underscores
        while '__' in cleaned:
            cleaned = cleaned.replace('__', '_')
        
        # Remove leading/trailing underscores
        cleaned = cleaned.strip('_')
        
        return cleaned
    
    def save_to_json(self, flashcards, filename="flashcards.json"):
        """Save flashcards to JSON file."""
        try:
            # Ensure output directory exists
            self.output_dir.mkdir(exist_ok=True)
            
            output_file = self.output_dir / filename
            
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(flashcards, f, indent=2, ensure_ascii=False)
            
            print(f"Saved {len(flashcards)} flashcards to {output_file}")
            return output_file
            
        except Exception as e:
            print(f"Error saving JSON file: {e}")
            return None
    
    def generate_statistics(self, flashcards):
        """Generate statistics about the flashcards."""
        if not flashcards:
            return
        
        total_cards = len(flashcards)
        cards_with_audio = sum(1 for card in flashcards if card['front']['audioUrl'])
        cards_with_images = sum(1 for card in flashcards if card['front']['imageUrl'])
        
        # Count by level
        level_counts = {}
        for card in flashcards:
            level = card.get('level', 'Unknown')
            level_counts[level] = level_counts.get(level, 0) + 1
        
        print("\n=== FLASHCARD STATISTICS ===")
        print(f"Total flashcards: {total_cards}")
        print(f"Cards with audio: {cards_with_audio} ({cards_with_audio/total_cards*100:.1f}%)")
        print(f"Cards with images: {cards_with_images} ({cards_with_images/total_cards*100:.1f}%)")
        print("\nLevel distribution:")
        for level, count in sorted(level_counts.items()):
            print(f"  {level}: {count} cards ({count/total_cards*100:.1f}%)")

def main():
    # Define paths
    base_dir = Path(__file__).parent
    excel_file = base_dir / "English Compass Wordlist A1_A2_B1 21 06 11.xlsx"
    audio_dir = base_dir / "word_audio"
    images_dir = base_dir / "word_images"
    output_dir = base_dir
    
    # Create processor
    processor = FlashCardDataProcessor(excel_file, audio_dir, images_dir, output_dir)
    
    # Process data
    print("Processing Excel data...")
    flashcards = processor.process_excel_data()
    
    if flashcards:
        # Save to JSON
        output_file = processor.save_to_json(flashcards)
        
        # Generate statistics
        processor.generate_statistics(flashcards)
        
        print(f"\n✅ Processing complete! JSON file saved as: {output_file}")
    else:
        print("❌ No flashcards were processed")

if __name__ == "__main__":
    main()
