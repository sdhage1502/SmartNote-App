import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotesStore } from '../../stores/notes.store';
import { Note } from '../../models/note.model';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ButtonModule, TooltipModule, DialogModule],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css'],
})
export class NoteListComponent implements OnInit {
  showMobileSearch: boolean = false; // Defined for compatibility, but removed in HTML

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

  async deleteNote(id: string) {
    await this.store.deleteNote(id);
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }

  getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }
}