import { Component, inject, effect } from '@angular/core';
import { NotesStore } from '../../stores/notes.store';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CommonModule } from '@angular/common';
import { Note, Conflict } from '../../services/note.service';

@Component({
  selector: 'app-conflict-resolver',
  standalone: true,
  imports: [DialogModule, ButtonModule, CommonModule],
  templateUrl: './conflict-resolver.component.html',
  styleUrls: ['./conflict-resolver.component.css'],
})
export class ConflictResolverComponent {
  store = inject(NotesStore);
  visible = false;

  constructor() {
    effect(() => {
      this.visible = this.store.conflicts().length > 0;
    });
  }

  resolveConflict(conflict: Conflict, selectedNote: Note) {
    this.store.resolveConflict(conflict.noteId, selectedNote);
  }
}