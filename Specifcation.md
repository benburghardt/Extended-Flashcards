# Flashcard Application Specification

## Overview

This application is a **locally-run flashcard tool** designed to assist with studying using a flexible and visual interface. The key feature is the ability to create flashcards with **more than two sides** and connect these sides using **labeled arrows**, enabling complex relationships between concepts.

---

## Features

### 1. Flashcard Structure

- Each **flashcard** can have **multiple sides**, not limited to front/back.
- Users can:
  - Add unlimited sides to each flashcard.
  - Label each side with a **value** (e.g., a word, term, or concept).
  - Create **labeled arrows** between any two sides, defining a **directional relationship** (e.g., "English → Spanish").
  - Allow for **bidirectional arrows**, each with its own label (e.g., "English → Spanish", "Spanish → English").
- Flashcards can be saved as **templates** for reusability in different sets.

---

### 2. Flashcard Sets

- Users can group flashcards into **sets (decks)**.
- Each set contains:
  - A collection of complex flashcards.
  - The relational structure between sides.
- Users can export and import:
  - **Flashcard set files** (containing card content and connections).
  - **Template files** (containing reusable flashcard formats).

---

### 3. User Interface & Design

- **Graphical UI**:
  - Drag-and-drop interface to position flashcard sides.
  - Click-and-drag arrows to connect sides.
  - Labels displayed on both sides and arrows.
- Intuitive controls for adding/removing sides and relationships.

---

### 4. Study Modes

The app will include multiple study modes at launch:

#### a. Self-Test Mode
- Show one side of an arrow.
- Prompt user to input or recall the connected side.
- Evaluate correctness and track success.

#### b. Spaced Repetition
- Uses an algorithm to show cards at optimal intervals based on past performance.
- Focuses on transitions (arrows) that need more review.

#### c. Flash Mode
- Allows users to freely navigate and explore complex flashcards.
- Ideal for learning structure or reviewing entire card networks.

#### d. Multiple Choice
- Presents one side and offers several options for the connected side.
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
- Real-time collaboration.
- Tags for organizing flashcards.
- Filtering flashcards by difficulty or tags.
- Advanced search capabilities.
- Full version history or edit tracking.
- Public sharing or publishing mechanisms.

---

## Summary

This flashcard application offers a **nonlinear**, **visual** approach to learning. By letting users create **multi-sided cards** and define **custom relationships**, it supports deeper learning and flexible studying. The initial release will be focused, local-first, and powerful enough to support complex educational needs, with clear potential for future expansion.
