import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { NoteListComponent } from './components/note-list/note-list.component';
import { NoteEditComponent } from './components/note-edit/note-edit.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'notes', component: NoteListComponent, canActivate: [authGuard] },
  { path: 'note/:id', component: NoteEditComponent, canActivate: [authGuard] },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
];