import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { Note, Conflict } from '../models/note.model';
import { Timestamp } from 'firebase/firestore';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private notesCollection: AngularFirestoreCollection<Note> | null = null;

  constructor(
    private afs: AngularFirestore,
    private auth: AngularFireAuth
  ) {
    // Enable Firestore offline persistence
    this.afs.firestore.enablePersistence({ synchronizeTabs: true }).catch((err) => {
      console.error('Failed to enable offline persistence:', err);
    });

    this.auth.user.subscribe((user) => {
      if (user) {
        this.notesCollection = this.afs.collection<Note>(`users/${user.uid}/notes`);
      }
    });
  }

  async getNotes(): Promise<Note[]> {
    return this.auth.user.pipe(
      switchMap((user) => {
        if (!user || !this.notesCollection) return of([]);
        return this.notesCollection
          .valueChanges({ idField: 'id' })
          .pipe(map((notes: Note[]) => notes));
      }),
      first()
    ).toPromise() as Promise<Note[]>;
  }

  async addNote(note: Note): Promise<Note> {
    if (!this.notesCollection) throw new Error('User not authenticated');
    const id = this.afs.createId();
    const newNote: Note = {
      ...note,
      id,
      updatedAt: Timestamp.now(),
      version: note.version || 1,
    };
    try {
      await this.notesCollection.doc(id).set(newNote);
      return newNote;
    } catch (error) {
      console.error('Add note failed:', error);
      throw error;
    }
  }

  async updateNote(note: Note): Promise<void> {
    if (!this.notesCollection) throw new Error('User not authenticated');
    try {
      const existingNote = (await this.notesCollection
        .doc(note.id)
        .get()
        .toPromise())?.data() as Note | undefined;

      if (existingNote && existingNote.version > note.version) {
        const conflict: Conflict = {
          noteId: note.id,
          localNote: note,
          serverNote: existingNote,
        };
        throw { conflict };
      }

      await this.notesCollection.doc(note.id).set({
        ...note,
        updatedAt: Timestamp.now(),
        version: note.version + 1,
      });
    } catch (error) {
      console.error('Update note failed:', error);
      throw error;
    }
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.notesCollection) throw new Error('User not authenticated');
    try {
      await this.notesCollection.doc(id).delete();
    } catch (error) {
      console.error('Delete note failed:', error);
      throw error;
    }
  }

  listenForNotes(): Observable<Note[]> {
    return this.auth.user.pipe(
      switchMap((user) => {
        if (!user || !this.notesCollection) return of([]);
        return this.notesCollection.valueChanges({ idField: 'id' });
      })
    );
  }

  mergeConflict(conflict: Conflict): Note {
    return {
      id: conflict.noteId,
      title: conflict.localNote.title || conflict.serverNote.title,
      content: `${conflict.localNote.content}\n\n--- Merged ---\n\n${conflict.serverNote.content}`,
      updatedAt: Timestamp.now(),
      version: Math.max(conflict.localNote.version, conflict.serverNote.version) + 1,
    };
  }
}