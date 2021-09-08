import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { v4 as uuid } from 'uuid';

import { Subject } from './subject/subject.component';
import { Module } from './module/module.component';
import { Weighting } from './weighting/weighting.component';

import example2FachBA from '../assets/example-2fach-ba.json';

const GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

interface IDistribution {
  subject: Subject;
  outcomes: number[];
}

class SaveState {
  public static allStates = new Array<SaveState>();

  id: string;
  title: string;
  subjects: Subject[];

  constructor(obj?: Partial<SaveState>) {
    this.id = obj?.id ?? uuid();
    this.title = obj?.title ?? '';
    this.subjects = obj?.subjects?.map(s => new Subject(s)) ?? [];
  }

  public save() {
    localStorage.setItem('wiskas::' + this.id, JSON.stringify(this));
  }
}

new SaveState(example2FachBA as SaveState).save();

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public labeledResults: { [key: string]: number } = {};

  private state = new BehaviorSubject<SaveState>(new SaveState());
  private allStates = new BehaviorSubject<SaveState[]>([]);

  public selectedLoadState: SaveState | undefined;

  constructor(private snackbar: MatSnackBar) {
    (window as any)['showState'] = () => this.state.getValue();
  }

  get state$() {
    return this.state.asObservable();
  }

  get stateTitle$() {
    return this.state$.pipe(map(state => state.title));
  }

  get subjects$() {
    return this.state$.pipe(map(state => state.subjects));
  }

  get hasSubjects$() {
    return this.subjects$.pipe(map(subjects => subjects.length !== 0));
  }

  get ungraded$() {
    return this.state$.pipe(
      map(state => state.subjects.filter(s => s.ungraded.length > 0).flatMap(s => s.ungraded)),
    );
  }

  get isOneHundred$() {
    return this.state$.pipe(
      map(state => state.subjects.reduce((acc, s) => acc + s.percentage, 0) === 100),
    );
  }

  get hasEmptySubject$() {
    return this.state$.pipe(map(state => !!state.subjects.find(s => s.modules.length === 0)));
  }

  get savedStates$() {
    return this.allStates.asObservable();
  }

  get savedStatesTitles$() {
    return this.savedStates$.pipe(map(states => states.map(state => state.title)));
  }

  public updateStateTitle(event: Event) {
    const target = event.target as HTMLInputElement | undefined;
    if (!target) return;
    this.state.getValue().title = target.value;
  }

  public loadState(id: string) {
    const state = this.allStates.getValue().find(state => state.id === id);
    if (!state) return;
    this.state.next(state);

    setTimeout(() => this.calculate(), 100);
    this.showMessage('Zustand geladen');
  }

  get distMax() {
    return Math.max(...Object.values(this.labeledResults));
  }

  get distSize() {
    return Object.values(this.labeledResults).reduce((acc, val) => acc + val, 0);
  }

  public getProbability(key: string) {
    return (100 * (this.labeledResults[key] / this.distSize)).toFixed(1) + '%';
  }

  public showMessage(message: string) {
    this.snackbar.open(message, 'OK Cool!', { duration: 3000 });
  }

  public saveState() {
    this.state.getValue().save();
    this.showMessage('Zustand gespeichert');
    this.updateSavedStates();
  }

  public addSubject() {
    this.state.getValue().subjects.push(new Subject());
  }

  public removeSubject(subject: Subject) {
    const index = this.state.getValue().subjects.findIndex(s => s.id === subject.id);
    if (index < 0) return;
    this.state.getValue().subjects.splice(index, 1);
  }

  private distributeWeights(likely: number) {
    const index = GRADES.findIndex(g => g === likely);
    const arr = new Array<number>();
    for (let i = 0; i < 3; i++) {
      for (let j = 3 - i; j > 0; j--) {
        const left = GRADES[index - i];
        const right = GRADES[index + i];
        if (left && left !== right) arr.push(left);
        if (right) arr.push(right);
      }
    }
    return arr.concat(GRADES).sort((a, b) => a - b);
  }

  private getSubjectDistribution(subject: Subject) {
    const weights = subject.weightings;
    const totalCredits = subject.totalCredits;
    const gradedSum = subject.graded.reduce(
      (acc, mod) => acc + mod.grade! * (mod.credits / totalCredits),
      0,
    );
    const outcomes = new Array<number>();
    for (const mod of subject.ungraded) {
      const weight = weights.find(w => w.moduleRef === mod.id);
      if (!weight) continue;

      const allowed = this.distributeWeights(weight.likely).filter(
        g => g >= weight.best && g <= weight.worst,
      );

      const factor = mod.credits / totalCredits;
      for (const grade of allowed) {
        outcomes.push(gradedSum + grade * factor);
      }
    }
    if (outcomes.length === 0) outcomes.push(gradedSum);
    return outcomes.map(o => o * subject.percentageAsNum);
  }

  private reset() {
    this.labeledResults = {};
  }

  public calculate() {
    if (this.state.getValue().subjects.reduce((acc, s) => acc + s.percentage, 0) !== 100) {
      return this.reset();
    }

    const dists = this.state.getValue().subjects.map(s => this.getSubjectDistribution(s));
    if (Math.max(...dists.flatMap(arr => Math.max(...arr))) === 0) {
      return this.reset();
    }

    const walk = (sums: number[]): string[] => {
      const dist = dists.pop();
      if (!dist) return sums.map(s => Math.max(s, 1.01).toString().slice(0, 3));
      return walk(dist.flatMap(o => sums.map(s => s + o)));
    };

    const results = walk(dists.pop()!);

    const counter = new Map<string, number>();

    for (const result of results) {
      counter.set(result, (counter.get(result) ?? 0) + 1);
    }

    this.labeledResults = Object.fromEntries(counter.entries());
    console.log(this.labeledResults);
  }

  private updateSavedStates() {
    const parsedStates = Object.keys(localStorage)
      .filter(k => k.startsWith('wiskas::'))
      .map(k => JSON.parse(localStorage.getItem(k)!) as Partial<SaveState>);
    this.allStates.next(parsedStates.map(state => new SaveState(state)));
  }

  ngOnInit() {
    this.updateSavedStates();
  }
}
