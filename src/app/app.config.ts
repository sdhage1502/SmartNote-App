import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import {
  provideFirestore,
  initializeFirestore,
  persistentLocalCache,
} from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { NotesStore } from './stores/notes.store';
import { NoteService } from './services/note.service';
import { AuthService } from './services/auth.service';

import { routes } from './app.routes';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() =>
      initializeFirestore(getApp(), {
        localCache: persistentLocalCache(),
      })
    ),
    provideAuth(() => getAuth()),
    NotesStore,
    NoteService,
    AuthService,
  ],
};
