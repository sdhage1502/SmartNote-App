import { Timestamp } from 'firebase/firestore';

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
