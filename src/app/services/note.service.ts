import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';
import { Note, Conflict } from '../models/note.model';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private notesCollection: AngularFirestoreCollection<Note> | null = null;

  constructor(
    private afs: AngularFirestore,
    private auth: AngularFireAuth
  ) {
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
    const newNote: Note = { ...note, id, updatedAt: Timestamp.now() };
    await this.notesCollection.doc(id).set(newNote);
    return newNote;
  }

  async updateNote(note: Note): Promise<void> {
    if (!this.notesCollection) throw new Error('User not authenticated');
    const existingNote = (await this.notesCollection
      .doc(note.id)
      .get()
      .toPromise())?.data() as Note | undefined;
    
    if (existingNote && existingNote.version > note.version) {
      throw new Error('Conflict detected: Server version is newer');
    }
    
    await this.notesCollection.doc(note.id).set({
      ...note,
      updatedAt: Timestamp.now(),
      version: note.version + 1,
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.notesCollection) throw new Error('User not authenticated');
    await this.notesCollection.doc(id).delete();
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
      title: conflict.localNote.title,
      content: `${conflict.localNote.content}\n\n--- Merged ---\n\n${conflict.serverNote.content}`,
      updatedAt: Timestamp.now(),
      version: Math.max(conflict.localNote.version, conflict.serverNote.version) + 1,
    };
  }
}