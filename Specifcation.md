# Flashcard Application Specification

## Overview

This application is a **native desktop flashcard tool** designed to assist with studying using a flexible and visual interface. The key feature is the ability to create flashcards with **more than two sides** and connect these sides using **labeled arrows**, enabling complex relationships between concepts. The application is built with cross-platform compatibility as a secondary goal.

---

## Features

### 1. Flashcard Structure

- Each **flashcard** can have **multiple sides**, not limited to front/back.
- Users can:
  - Add unlimited sides to each flashcard.
  - Label each side with a **value** supporting Unicode characters (e.g., a word, term, or concept).
  - Create **labeled arrows** between any two sides **within the same flashcard**, defining a **directional relationship** (e.g., "English → Spanish").
  - Allow for **bidirectional arrows**, each with its own label (e.g., "English → Spanish", "Spanish → English").
- Flashcards can be saved as **templates** for reusability in different sets, copying the structural layout of sides and arrows.

---

### 2. Flashcard Sets

- Users can group flashcards into **sets (decks)**.
- Each set contains:
  - A collection of complex flashcards.
  - The relational structure between sides.
- Users can export and import:
  - **Flashcard set files** in JSON format (containing card content and connections).
  - **Template files** in JSON format (containing reusable flashcard formats).

---

### 3. User Interface & Design

- **Canvas-based Graphical UI**:
  - Free-form positioning of flashcard sides on a canvas with optional grid snapping.
  - Arrow creation via tool selection: click arrow tool, then source side, then destination side.
  - Labels displayed on both sides and arrows.
  - Automatic layout algorithms available to help organize visual appearance without restricting user control.
- Intuitive controls for adding/removing sides and relationships.

---

### 4. Study Modes

The app will include multiple study modes at launch:

#### a. Self-Test Mode
- Show one side of an arrow.
- Prompt user to input or recall the connected side.
- Evaluate correctness using case-insensitive and fuzzy matching and track success.

#### b. Spaced Repetition
- Uses the SM-2 algorithm (or similar) to show cards at optimal intervals based on past performance.
- Focuses on transitions (arrows) that need more review.

#### c. Flash Mode
- Allows users to freely navigate and explore complex flashcards.
- Ideal for learning structure or reviewing entire card networks.

#### d. Multiple Choice
- Presents one side and offers several options for the connected side.
- Incorrect options generated randomly from other sides in the set, prioritizing sides with the same arrow relation label.
- Only one correct answer.

#### e. Custom Paths
- Follow a predefined learning path defined by arrows between sides.
- Useful for structured flows (e.g., concept progression or language translation paths).

---

### 5. Navigation & Testing Behavior

- Users will be **tested on each arrow/relationship** defined in a card.
- Arrows form the basis for learning logic, not just card sides.
- Future expansions may include comprehensive card-level testing or graph traversal.

---

### 6. Sharing & Portability

- Flashcards are stored and shared via **local files**.
  - Sets can be shared as files with others.
  - Templates are stored locally and exportable.
- No online collaboration, real-time editing, or permissions at launch.

---

### 7. User Management

- **No user accounts.**
- The application is fully **offline** and all data is stored **locally**.
- No privacy settings are necessary.

---

### 8. Progress Tracking

- The app will track:
  - How many times each arrow (relationship) has been tested.
  - How many times the user has answered correctly.
- Used to inform spaced repetition and user review.

---

### 9. Planned & Deferred Features

These features are **not planned for the initial release** but may be considered in future updates:

- Media support (images, audio, video on flashcard sides).
- Rich text formatting (bold, italic, underline) - secondary priority.
- Real-time collaboration.
- Tags for organizing flashcards.
- Filtering flashcards by difficulty or tags.
- Advanced search capabilities.
- Full version history or edit tracking.
- Public sharing or publishing mechanisms.
- Cross-flashcard networks where cards with matching side values connect into larger study networks.

---

## Technical Requirements

### Platform & Technology
- **Native desktop application** with cross-platform compatibility as a secondary goal
- **Data storage**: JSON format for sets and templates
- **Text support**: Unicode characters with potential for basic rich text formatting

### User Interface Implementation
- **Canvas-based editor**: Free-form positioning with optional grid snapping for initial builds
- **Arrow creation workflow**: Tool selection → source side click → destination side click
- **Layout assistance**: Automatic layout algorithms available but not imposed
- **Scope constraint**: Arrows only connect sides within the same flashcard

### Study Algorithm Specifications
- **Answer matching**: Case-insensitive with fuzzy matching support
- **Spaced repetition**: SM-2 algorithm or similar implementation
- **Multiple choice generation**: Random selection from set, prioritizing same arrow relation labels

---

## Summary

This flashcard application offers a **nonlinear**, **visual** approach to learning. By letting users create **multi-sided cards** and define **custom relationships**, it supports deeper learning and flexible studying. The initial release will be focused, local-first, and powerful enough to support complex educational needs, with clear potential for future expansion.
