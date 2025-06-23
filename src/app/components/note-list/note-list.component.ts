import { Component, OnInit } from '@angular/core';
import { CommonModule, NgFor, NgIf, SlicePipe, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotesStore } from '../../stores/notes.store';
import { Note } from '../../models/note.model';
import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-note-list',
  standalone: true,
  imports: [CommonModule, RouterModule, NgFor, NgIf, SlicePipe, DatePipe],
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.css'],
})
export class NoteListComponent implements OnInit {
  constructor(
    public store: NotesStore,
    private router: Router,
    private auth: Auth // Use modular Auth
  ) {}

  ngOnInit() {
    this.store.loadNotes();
  }

  async createNote() {
    try {
      console.log('Create note button clicked'); // Debug log
      const currentUser = await firstValueFrom(user(this.auth));
      if (!currentUser) {
        console.warn('User not authenticated, redirecting to login');
        await this.router.navigate(['/login']);
        return;
      }
      await this.router.navigate(['/note/new']);
      console.log('Navigated to /note/new'); // Debug log
    } catch (error) {
      console.error('Failed to navigate to create note:', error);
    }
  }

  editNote(id: string) {
    this.router.navigate(['/note', id]).catch((error) => {
      console.error('Failed to navigate to edit note:', error);
    });
  }

  async deleteNote(id: string) {
    try {
      await this.store.deleteNote(id);
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  }

  trackByNoteId(index: number, note: Note): string {
    return note.id;
  }

  getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }
}