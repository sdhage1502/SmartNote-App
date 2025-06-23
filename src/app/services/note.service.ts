import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Auth, user } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { Note, Conflict } from '../models/note.model';
import { Timestamp } from '@firebase/firestore';

@Injectable({
  providedIn: 'root',
})
export class NoteService {
  private notesCollectionPath: string | null = null;

  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {
    user(this.auth).subscribe((user) => {
      if (user) {
        this.notesCollectionPath = `users/${user.uid}/notes`;
      } else {
        this.notesCollectionPath = null;
      }
    });

    // Enable offline persistence
    import('@firebase/firestore').then(({ enableMultiTabIndexedDbPersistence }) => {
      enableMultiTabIndexedDbPersistence(this.firestore).catch((err) => {
        console.error('Failed to enable offline persistence:', err);
      });
    });
  }

  async getNotes(): Promise<Note[]> {
    const currentUser = await user(this.auth).pipe(first()).toPromise();
    if (!currentUser || !this.notesCollectionPath) {
      return [];
    }
    const notesCol = collection(this.firestore, this.notesCollectionPath);
    const notes = await collectionData(notesCol, { idField: 'id' })
      .pipe(first())
      .toPromise();
    return (notes as Note[]) || [];
  }

  async addNote(note: Note): Promise<Note> {
    if (!this.notesCollectionPath) {
      throw new Error('User not authenticated');
    }
    const id = doc(collection(this.firestore, this.notesCollectionPath)).id;
    const newNote: Note = {
      ...note,
      id,
      updatedAt: Timestamp.now(),
      version: note.version || 1,
    };
    try {
      await setDoc(doc(this.firestore, `${this.notesCollectionPath}/${id}`), newNote);
      return newNote;
    } catch (error) {
      console.error('Add note failed:', error);
      throw error;
    }
  }

  async updateNote(note: Note): Promise<void> {
    if (!this.notesCollectionPath) {
      throw new Error('User not authenticated');
    }
    try {
      const noteRef = doc(this.firestore, `${this.notesCollectionPath}/${note.id}`);
      const existingNote = (await getDoc(noteRef)).data() as Note | undefined;

      if (existingNote && existingNote.version > note.version) {
        const conflict: Conflict = {
          noteId: note.id,
          localNote: note,
          serverNote: existingNote,
        };
        throw { conflict };
      }

      await setDoc(noteRef, {
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
    if (!this.notesCollectionPath) {
      throw new Error('User not authenticated');
    }
    try {
      await deleteDoc(doc(this.firestore, `${this.notesCollectionPath}/${id}`));
    } catch (error) {
      console.error('Delete note failed:', error);
      throw error;
    }
  }

  listenForNotes(): Observable<Note[]> {
    return user(this.auth).pipe(
      switchMap((currentUser) => {
        if (!currentUser || !this.notesCollectionPath) {
          return of([]);
        }
        const notesCol = collection(this.firestore, this.notesCollectionPath);
        return collectionData(notesCol, { idField: 'id' }) as Observable<Note[]>;
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