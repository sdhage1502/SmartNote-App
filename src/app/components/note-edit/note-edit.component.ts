import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NotesStore } from '../../stores/notes.store';
import { Note, Conflict } from '../../models/note.model';
import { Timestamp } from 'firebase/firestore';
import { interval, Subscription } from 'rxjs';
import { NoteService } from '../../services/note.service';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.css'],
})
export class NoteEditComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  title: string = '';
  content: string = '';
  isSaving: boolean = false;
  showUnsavedWarning: boolean = false;
  autoSaved: boolean = false;
  private noteId: string | null = null;
  private initialTitle: string = '';
  private initialContent: string = '';
  private autoSaveSubscription: Subscription | null = null;

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
      if (this.isEditing) {
        await this.store.updateNote(note);
      } else {
        await this.store.addNote(note);
      }
      this.initialTitle = this.title;
      this.initialContent = this.content;
      this.autoSaved = true;
      setTimeout(() => (this.autoSaved = false), 3000); // Hide auto-saved message after 3s
      this.router.navigate(['/notes']);
    } catch (error: any) {
      if (error.conflict) {
        const resolvedNote = this.noteService.mergeConflict(error.conflict);
        await this.store.resolveConflict(error.conflict.noteId, resolvedNote);
        this.initialTitle = resolvedNote.title;
        this.initialContent = resolvedNote.content;
        this.title = resolvedNote.title;
        this.content = resolvedNote.content;
        this.autoSaved = true;
        setTimeout(() => (this.autoSaved = false), 3000);
      } else {
        console.error('Save failed:', error);
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
    this.saveNote();
    this.showUnsavedWarning = false;
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
    } else {
      this.showUnsavedWarning = false;
    }
  }

  private hasUnsavedChanges(): boolean {
    return this.title !== this.initialTitle || this.content !== this.initialContent;
  }

  private startAutoSave() {
    this.autoSaveSubscription = interval(30000).subscribe(() => {
      if (this.hasUnsavedChanges() && !this.isSaving) {
        this.saveNote();
      }
    });
  }
}