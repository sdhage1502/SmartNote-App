import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { NoteService, Note, Conflict } from '../services/note.service';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

interface NotesState {
  notes: Note[];
  syncStatus: 'idle' | 'syncing' | 'offline' | 'error';
  conflicts: Conflict[];
  history: Note[][];
  historyIndex: number;
  error: string | null;
}

export const NotesStore = signalStore(
  withState<NotesState>({
    notes: [],
    syncStatus: 'idle',
    conflicts: [],
    history: [[]],
    historyIndex: 0,
    error: null,
  }),
  withMethods((store, noteService = inject(NoteService)) => ({
    async loadNotes() {
      const cachedNotes = localStorage.getItem('notes');
      if (cachedNotes) {
        patchState(store, { notes: JSON.parse(cachedNotes) });
      }
      patchState(store, { syncStatus: 'syncing', error: null });
      try {
        const collection = await noteService.getNotesCollection();
        collection
          .valueChanges({ idField: 'id' })
          .pipe(
            tap((notes) => {
              localStorage.setItem('notes', JSON.stringify(notes));
              patchState(store, { syncStatus: 'idle', error: null });
            }),
            catchError((err: Error) => {
              patchState(store, {
                syncStatus: 'error',
                error: 'Failed to sync notes: ' + (err.message || 'Unknown error'),
              });
              return throwError(() => err);
            })
          )
          .subscribe({
            next: (notes) => patchState(store, { notes }),
            error: (err: Error) => {
              console.error('Firestore subscription error:', err);
            },
          });
      } catch (err: Error) {
        console.error('Error loading notes collection:', err);
        patchState(store, {
          syncStatus: 'error',
          error: 'Failed to load notes: ' + (err.message || 'Unknown error'),
        });
      }
    },
    async addNote(title: string, content: string) {
      try {
        const note = await noteService.addNote({ title, content });
        patchState(store, (state) => ({
          notes: [...state.notes, note],
          history: [...state.history.slice(0, state.historyIndex + 1), [...state.notes, note]],
          historyIndex: state.historyIndex + 1,
        }));
      } catch (err: Error) {
        patchState(store, {
          syncStatus: 'error',
          error: 'Failed to add note: ' + (err.message || 'Unknown error'),
        });
      }
    },
    async updateNote(note: Note) {
      try {
        const result = await noteService.updateNote(note);
        if (result.conflict) {
          patchState(store, (state) => ({
            conflicts: [
              ...state.conflicts,
              { noteId: note.id, localNote: note, serverNote: result.serverNote! },
            ],
          }));
        } else {
          patchState(store, (state) => {
            const updatedNotes = state.notes.map((n) =>
              n.id === note.id ? result.updatedNote! : n
            );
            return {
              notes: updatedNotes,
              history: [...state.history.slice(0, state.historyIndex + 1), updatedNotes],
              historyIndex: state.historyIndex + 1,
            };
          });
        }
      } catch (err: Error) {
        patchState(store, {
          syncStatus: 'error',
          error: 'Failed to update note: ' + (err.message || 'Unknown error'),
        });
      }
    },
    async deleteNote(id: string) {
      try {
        await noteService.deleteNote(id);
        patchState(store, (state) => {
          const updatedNotes = state.notes.filter((n) => n.id !== id);
          return {
            notes: updatedNotes,
            history: [...state.history.slice(0, state.historyIndex + 1), updatedNotes],
            historyIndex: state.historyIndex + 1,
          };
        });
      } catch (err: Error) {
        patchState(store, {
          syncStatus: 'error',
          error: 'Failed to delete note: ' + (err.message || 'Unknown error'),
        });
      }
    },
    async resolveConflict(noteId: string, selectedNote: Note) {
      try {
        const result = await noteService.updateNote({
          ...selectedNote,
          version: selectedNote.version + 1,
        });
        if (!result.conflict) {
          patchState(store, (state) => {
            const updatedNotes = state.notes.map((n) =>
              n.id === noteId ? result.updatedNote! : n
            );
            return {
              notes: updatedNotes,
              conflicts: state.conflicts.filter((c) => c.noteId !== noteId),
              history: [...state.history.slice(0, state.historyIndex + 1), updatedNotes],
              historyIndex: state.historyIndex + 1,
            };
          });
        }
      } catch (err: Error) {
        patchState(store, {
          syncStatus: 'error',
          error: 'Failed to resolve conflict: ' + (err.message || 'Unknown error'),
        });
      }
    },
    undo() {
      if (store.historyIndex() > 0) {
        patchState(store, (state) => ({
          notes: state.history[state.historyIndex - 1],
          historyIndex: state.historyIndex - 1,
        }));
      }
    },
    redo() {
      if (store.historyIndex() < store.history().length - 1) {
        patchState(store, (state) => ({
          notes: state.history[state.historyIndex + 1],
          historyIndex: state.historyIndex + 1,
        }));
      }
    },
  }))
);