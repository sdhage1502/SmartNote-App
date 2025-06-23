import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { first, switchMap, of } from 'rxjs';
import { Note, Conflict } from '../models/note.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private path: string | null = null;

  constructor(private fs: Firestore, private auth: Auth) {
    user(this.auth).subscribe(u => this.path = u ? `users/${u.uid}/notes` : null);
  }

  async getNotes(): Promise<Note[]> {
    // similar to code posted above...
  }

  async addNote(/* ... */) { /* ... */ }  
  async updateNote(/* ... */) { /* ... */ }
  async deleteNote(/* ... */) { /* ... */ }
  listenForNotes() { /* ... */ }
  mergeConflict(c: Conflict): Note { /* ... */ }
}
