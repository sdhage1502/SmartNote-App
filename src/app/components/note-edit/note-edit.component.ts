import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NotesStore } from '../../stores/notes.store';
import { NoteService } from '../../services/note.service';
import { Note, Conflict } from '../../models/note.model';
import { Timestamp } from 'firebase/firestore';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIf, NgFor, SlicePipe],
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.css'],
})
export class NoteEditComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  title: string = '';
  content: string = '';
  isSaving: boolean = false;
  showUnsavedWarning: boolean = false;
  showConflictWarning: boolean = false;
  conflict: Conflict | null = null;
  autoSaved: boolean = false;
  private noteId: string | null = null;
  private initialTitle: string = '';
  private initialContent: string = '';
  private autoSaveSubscription: Subscription | null = null;
  notification = signal<{ message: string; type: 'success' | 'info' } | null>(null);

  constructor(
    private store: NotesStore,
    private noteService: NoteService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  get isEditing(): boolean {
    return !!this.noteId && this.noteId !== 'new';
  }

  ngOnInit() {
    this.noteId = this.route.snapshot.paramMap.get('id');

    if (this.noteId && this.noteId !== 'new') {
      this.note = this.store.notes().find((n: Note) => n.id === this.noteId) || null;
      if (this.note) {
        this.title = this.note.title;
        this.content = this.note.content;
        this.initialTitle = this.note.title;
        this.initialContent = this.note.content;
      }
      this.checkForConflict();
    }
    this.startAutoSave();
  }

  ngOnDestroy() {
    if (this.autoSaveSubscription) {
      this.autoSaveSubscription.unsubscribe();
    }
  }

  getCurrentTime(): string {
    return new Date().toLocaleTimeString();
  }

  onTitleChange() {
    this.checkUnsavedChanges();
  }

  onContentChange() {
    this.checkUnsavedChanges();
  }

  onKeydown(event: KeyboardEvent) {
    if (event.ctrlKey && event.key === 's') {
      event.preventDefault();
      this.saveNote();
    }
  }

  getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }

  getReadingTime(text: string): number {
    return Math.ceil(this.getWordCount(text) / 200);
  }

  async saveNote() {
    if (!this.title.trim() || !this.content.trim()) return;

    this.isSaving = true;
    try {
      const note: Note = {
        id: this.noteId && this.noteId !== 'new' ? this.noteId : '',
        title: this.title,
        content: this.content,
        updatedAt: Timestamp.now(),
        version: this.note ? this.note.version + 1 : 1,
      };
      const isOnline = navigator.onLine;
      if (this.noteId && this.noteId !== 'new') {
        await this.store.updateNote(note);
        this.showNotification(
          isOnline ? 'Note updated successfully' : 'Note updated, will sync when online',
          isOnline ? 'success' : 'info'
        );
      } else {
        const newNoteId = await this.store.addNote(note);
        this.noteId = newNoteId;
        this.showNotification(
          isOnline ? 'Note created successfully' : 'Note created, will sync when online',
          isOnline ? 'success' : 'info'
        );
        await this.router.navigate(['/notes']);
      }
      this.initialTitle = this.title;
      this.initialContent = this.content;
      this.autoSaved = true;
      this.showUnsavedWarning = false;
    } catch (error: any) {
      if (error.message === 'Conflict detected') {
        this.checkForConflict();
      } else {
        console.error('Save failed:', error);
        this.showNotification('Failed to save note', 'info');
      }
    } finally {
      this.isSaving = false;
    }
  }

  discardChanges() {
    this.title = this.initialTitle;
    this.content = this.initialContent;
    this.showUnsavedWarning = false;
    this.navigateToNotes();
  }

  saveAndLeave() {
    this.saveNote().then(() => {
      this.navigateToNotes();
    });
  }

  navigateToNotes() {
    this.router.navigate(['/notes']);
  }

  canDeactivate(): boolean {
    return !this.hasUnsavedChanges();
  }

  private checkUnsavedChanges() {
    if (this.hasUnsavedChanges()) {
      this.showUnsavedWarning = true;
    }
  }

  private hasUnsavedChanges(): boolean {
    return this.title !== this.initialTitle || this.content !== this.initialContent;
  }

  private startAutoSave() {
    this.autoSaveSubscription = interval(30000).subscribe(() => {
      if (this.hasUnsavedChanges()) {
        this.saveNote();
      }
    });
  }

  private checkForConflict() {
    if (this.noteId) {
      const conflict = this.store.conflicts().find((c) => c.noteId === this.noteId);
      if (conflict) {
        this.conflict = conflict;
        this.showConflictWarning = true;
      }
    }
  }

  private showNotification(message: string, type: 'success' | 'info') {
    this.notification.set({ message, type });
    setTimeout(() => {
      this.notification.set(null);
    }, 3000); // Auto-dismiss after 3 seconds
  }

  async resolveConflict(resolution: 'local' | 'server' | 'merge') {
    if (!this.conflict) return;
    try {
      let resolvedNote: Note;
      if (resolution === 'local') {
        resolvedNote = {
          ...this.conflict.localNote,
          version: Math.max(this.conflict.localNote.version, this.conflict.serverNote.version) + 1,
          updatedAt: Timestamp.now(),
        };
      } else if (resolution === 'server') {
        resolvedNote = {
          ...this.conflict.serverNote,
          version: this.conflict.serverNote.version + 1,
          updatedAt: Timestamp.now(),
        };
      } else {
        resolvedNote = this.noteService.mergeConflict(this.conflict);
      }
      await this.store.resolveConflict(this.conflict.noteId, resolvedNote);
      this.showConflictWarning = false;
      this.conflict = null;
      const updatedNote = this.store.notes().find((n) => n.id === this.noteId);
      if (updatedNote) {
        this.title = updatedNote.title;
        this.content = updatedNote.content;
        this.initialTitle = updatedNote.title;
        this.initialContent = updatedNote.content;
        this.note = updatedNote;
      }
      this.showNotification('Conflict resolved successfully', 'success');
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      this.showNotification('Failed to resolve conflict', 'info');
    }
  }
}