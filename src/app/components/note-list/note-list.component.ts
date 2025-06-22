import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotesStore } from '../../stores/notes.store';
import { Note } from '../../models/note.model';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css'],
})
export class NoteListComponent implements OnInit {
  showDeleteConfirm: boolean = false;
  noteToDelete: string | null = null;

  constructor(
    public store: NotesStore,
    private router: Router
  ) {}

  ngOnInit() {
    this.store.loadNotes();
  }

  editNote(id: string) {
    this.router.navigate(['/notes/edit', id]);
  }

  confirmDelete(id: string) {
    this.noteToDelete = id;
    this.showDeleteConfirm = true;
  }

  async deleteNote() {
    if (this.noteToDelete) {
      try {
        await this.store.deleteNote(this.noteToDelete);
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
    this.cancelDelete();
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.noteToDelete = null;
  }

  createNewNote() {
    this.router.navigate(['/notes/edit', 'new']);
  }

  undo() {
    this.store.undo();
  }

  redo() {
    this.store.redo();
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }

  getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }
}