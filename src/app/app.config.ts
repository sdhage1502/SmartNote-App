import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideFirebaseApp, initializeApp, getApp } from '@angular/fire/app';
import { provideFirestore, initializeFirestore, enableIndexedDbPersistence } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { FIREBASE_OPTIONS } from '@angular/fire/compat';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { NotesStore } from './stores/notes.store';
import { NoteService } from './services/note.service';
import { AuthService } from './services/auth.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
    { provide: FIREBASE_OPTIONS, useValue: environment.firebase },
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideFirestore(() => {
      const firestore = initializeFirestore(getApp(), {
        experimentalAutoDetectLongPolling: true,
      });
      enableIndexedDbPersistence(firestore).catch(err =>
        console.error('Offline persistence error:', err)
      );
      return firestore;
    }),
    provideAuth(() => getAuth(getApp())),
    NotesStore,
    NoteService,
    AuthService,
  ],
};
