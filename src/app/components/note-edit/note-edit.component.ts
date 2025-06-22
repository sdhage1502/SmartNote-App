import { Component, inject, OnInit } from '@angular/core';
import { NotesStore } from '../../stores/notes.store';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule } from '@angular/forms';
import { Note } from '../../services/note.service';

@Component({
  selector: 'app-note-edit',
  standalone: true,
  imports: [ButtonModule, CardModule, FormsModule, RouterModule],
  templateUrl: './note-edit.component.html',
  styleUrls: ['./note-edit.component.css'],
})
export class NoteEditComponent implements OnInit {
  store = inject(NotesStore);
  route = inject(ActivatedRoute);
  router = inject(Router);
  note: Note | null = null;
  title = '';
  content = '';

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.note = this.store.notes().find((note) => note.id === id) || null;
      if (this.note) {
        this.title = this.note.title;
        this.content = this.note.content;
      }
    }
  }

  async saveNote() {
    if (this.title && this.content) {
      if (this.note) {
        // Update existing note
        await this.store.updateNote({
          id: this.note.id,
          title: this.title,
          content: this.content,
          updatedAt: this.note.updatedAt,
          version: this.note.version,
        });
      } else {
        // Add new note
        await this.store.addNote(this.title, this.content);
      }
      this.router.navigate(['/notes']);
    }
  }
}