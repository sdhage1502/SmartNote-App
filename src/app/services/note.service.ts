import { inject, Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import {
  AngularFirestore,
  AngularFirestoreCollection,
} from '@angular/fire/compat/firestore';
import { Timestamp } from 'firebase/firestore';
import firebase from 'firebase/compat/app';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: Timestamp;
  version: number;
}

export interface Conflict {
  noteId: string;
  localNote: Note;
  serverNote: Note;
}

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private auth = inject(AngularFireAuth);
  private firestore = inject(AngularFirestore);

  constructor() {
    // Enable persistence with multi-tab synchronization
    this.firestore.firestore
      .enablePersistence({ synchronizeTabs: true })
      .catch((error) => {
        console.error('Firestore persistence failed:', error);
      });
  }

  async getNotesCollection(): Promise<AngularFirestoreCollection<Note>> {
    const user = await this.auth.currentUser;
    if (!user?.uid) throw new Error('User not authenticated');
    return this.firestore.collection(`users/${user.uid}/notes`);
  }

  async addNote(note: Omit<Note, 'id' | 'updatedAt' | 'version'>): Promise<Note> {
    const user = await this.auth.currentUser;
    if (!user?.uid) throw new Error('User not authenticated');
    const noteRef = this.firestore.collection(`users/${user.uid}/notes`).doc();
    const newNote = {
      ...note,
      id: noteRef.ref.id,
      updatedAt: Timestamp.now(),
      version: 1,
    };
    await noteRef.set(newNote);
    return newNote;
  }

  async updateNote(note: Note): Promise<{ updatedNote?: Note; conflict?: boolean; serverNote?: Note }> {
    const user = await this.auth.currentUser;
    if (!user?.uid) throw new Error('User not authenticated');
    const noteRef = this.firestore.doc(`users/${user.uid}/notes/${note.id}`);
    const serverDoc = await noteRef.get().toPromise();
    if (serverDoc?.exists) {
      const serverNote = serverDoc.data() as Note;
      if (serverNote.version > note.version) {
        return { conflict: true, serverNote };
      }
    }
    const updatedNote = {
      ...note,
      updatedAt: Timestamp.now(),
      version: note.version + 1,
    };
    await noteRef.set(updatedNote);
    return { updatedNote, conflict: false };
  }

  async deleteNote(id: string): Promise<void> {
    const user = await this.auth.currentUser;
    if (!user?.uid) throw new Error('User not authenticated');
    const noteRef = this.firestore.doc(`users/${user.uid}/notes/${id}`);
    await noteRef.delete();
  }
}