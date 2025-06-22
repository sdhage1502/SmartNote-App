import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotesStore } from '../../stores/notes.store';
import { NoteService } from '../../services/note.service';
import { Note, Conflict } from '../../models/note.model';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-conflict-resolver',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, InputTextareaModule],
  templateUrl: './conflict-resolver.component.html',
  styleUrls: ['./conflict-resolver.component.css'],
})
export class ConflictResolverComponent implements OnInit {
  mergedContent: string = '';
  showManualMerge: boolean = false;

  constructor(
    public store: NotesStore,
    private noteService: NoteService
  ) {}

  ngOnInit() {
    if (this.store.conflicts().length > 0) {
      const conflict = this.store.conflicts()[0];
      this.mergedContent = this.noteService.mergeConflict(conflict).content;
    }
  }

  getWordCount(text: string): number {
    return text.trim().split(/\s+/).filter((word) => word.length > 0).length;
  }

  async keepLocal() {
    const conflict = this.store.conflicts()[0];
    await this.store.resolveConflict(conflict.noteId, conflict.localNote);
  }

  async keepServer() {
    const conflict = this.store.conflicts()[0];
    await this.store.resolveConflict(conflict.noteId, conflict.serverNote);
  }

  async mergeManually() {
    const conflict = this.store.conflicts()[0];
    const mergedNote: Note = {
      id: conflict.noteId,
      title: conflict.localNote.title,
      content: this.mergedContent,
      updatedAt: Timestamp.now(),
      version: Math.max(conflict.localNote.version, conflict.serverNote.version) + 1,
    };
    await this.store.resolveConflict(conflict.noteId, mergedNote);
    this.showManualMerge = false;
  }

  async saveBoth() {
    const conflict = this.store.conflicts()[0];
    const newNote: Note = {
      id: '',
      title: `${conflict.localNote.title} (Copy)`,
      content: conflict.localNote.content,
      updatedAt: Timestamp.now(),
      version: 1,
    };
    await this.store.addNote(newNote);
    await this.store.resolveConflict(conflict.noteId, conflict.serverNote);
  }

  toggleManualMerge() {
    this.showManualMerge = !this.showManualMerge;
  }
}