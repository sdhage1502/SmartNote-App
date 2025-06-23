import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  updateDoc
} from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Note, Conflict } from '../models/note.model';
import { Timestamp } from 'firebase/firestore';
import { Observable, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NoteService {
  private path: string | null = null;

  constructor(private fs: Firestore, private auth: Auth) {
    user(this.auth).subscribe(u => this.path = u ? `users/${u.uid}/notes` : null);
  }

  async getNotes(): Promise<Note[]> {
    if (!this.path) return [];
    const snap = await getDocs(collection(this.fs, this.path));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Note));
  }

  async addNote(note: Note): Promise<Note> {
    if (!this.path) throw new Error('No user path set');
    const ref = doc(collection(this.fs, this.path));
    const newNote = { ...note, id: ref.id, createdAt: Timestamp.now(), updatedAt: Timestamp.now() };
    await setDoc(ref, newNote);
    return newNote;
  }

  async updateNote(note: Note): Promise<void> {
    if (!this.path) throw new Error('No user path set');
    const ref = doc(this.fs, `${this.path}/${note.id}`);
    await updateDoc(ref, { ...note, updatedAt: Timestamp.now() });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.path) throw new Error('No user path set');
    const ref = doc(this.fs, `${this.path}/${id}`);
    await deleteDoc(ref);
  }

  listenForNotes(): Observable<Note[]> {
    if (!this.path) return of([]);
    const collRef = collection(this.fs, this.path);
    return collectionData(collRef, { idField: 'id' }) as Observable<Note[]>;
  }

  mergeConflict(c: Conflict): Note {
    // Example: prefer server version but keep local title if present
    return {
      ...c.serverNote,
      title: c.localNote.title || c.serverNote.title,
      version: c.serverNote.version + 1,
    };
  }
}
