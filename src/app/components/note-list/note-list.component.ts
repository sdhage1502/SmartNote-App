import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotesStore } from '../../stores/notes.store';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [ButtonModule, CardModule, CommonModule],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css'],
})
export class NoteListComponent {
  store = inject(NotesStore);
  router = inject(Router);

  ngOnInit() {
    this.store.loadNotes();
  }

  editNote(id: string) {
    this.router.navigate(['/note', id]);
  }

  deleteNote(id: string) {
    this.store.deleteNote(id);
  }

  addNote() {
    this.router.navigate(['/note', 'new']);
  }

  undo() {
    this.store.undo();
  }

  redo() {
    this.store.redo();
  }
}