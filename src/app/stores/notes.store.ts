import { Injectable, signal } from '@angular/core';
import { NoteService } from '../services/note.service';
import { Note, Conflict } from '../models/note.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class NotesStore {
  private _notes = signal<Note[]>([]);
  private _syncStatus = signal<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  private _conflicts = signal<Conflict[]>([]);
  private _history = signal<Note[][]>([]);
  private _historyIndex = signal(-1);

  constructor(private noteService: NoteService) {}

  notes = this._notes.asReadonly();
  syncStatus = this._syncStatus.asReadonly();
  conflicts = this._conflicts.asReadonly();
  history = this._history.asReadonly();
  historyIndex = this._historyIndex.asReadonly();

  async loadNotes() {
    this._syncStatus.set('syncing');
    try {
      const notes = await this.noteService.getNotes();
      this._notes.set(notes);
      this._syncStatus.set('synced');
      this.addToHistory();
    } catch (error) {
      this._syncStatus.set('error');
    }
  }

  async addNote(note: Note) {
    this._syncStatus.set('syncing');
    try {
      const newNote = await this.noteService.addNote(note);
      this._notes.update((notes) => [...notes, newNote]);
      this._syncStatus.set('synced');
      this.addToHistory();
    } catch (error) {
      this._syncStatus.set('error');
    }
  }

  async updateNote(note: Note) {
    this._syncStatus.set('syncing');
    try {
      await this.noteService.updateNote(note);
      this._notes.update((notes) =>
        notes.map((n) => (n.id === note.id ? note : n))
      );
      this._syncStatus.set('synced');
      this.addToHistory();
    } catch (error) {
      this._syncStatus.set('error');
    }
  }

  async deleteNote(id: string) {
    this._syncStatus.set('syncing');
    try {
      await this.noteService.deleteNote(id);
      this._notes.update((notes) => notes.filter((n) => n.id !== id));
      this._syncStatus.set('synced');
      this.addToHistory();
    } catch (error) {
      this._syncStatus.set('error');
    }
  }

  async resolveConflict(noteId: string, resolvedNote: Note) {
    try {
      await this.noteService.updateNote(resolvedNote);
      this._notes.update((notes) =>
        notes.map((n) => (n.id === noteId ? resolvedNote : n))
      );
      this._conflicts.update((conflicts) =>
        conflicts.filter((c) => c.noteId !== noteId)
      );
      this.addToHistory();
    } catch (error) {
      console.error('Conflict resolution failed:', error);
    }
  }

  undo() {
    if (this._historyIndex() > 0) {
      this._historyIndex.update((i) => i - 1);
      this._notes.set([...this._history()[this._historyIndex()]]);
    }
  }

  redo() {
    if (this._historyIndex() < this._history().length - 1) {
      this._historyIndex.update((i) => i + 1);
      this._notes.set([...this._history()[this._historyIndex()]]);
    }
  }

  private addToHistory() {
    this._history.update((history) => {
      const newHistory = history.slice(0, this._historyIndex() + 1);
      newHistory.push([...this._notes()]);
      return newHistory.slice(-50); // Limit history to 50 entries
    });
    this._historyIndex.update((i) => i + 1);
  }
}