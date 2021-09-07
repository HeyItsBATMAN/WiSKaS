import { Component } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';

import { Subject } from './subject/subject.component';
import { Module } from './module/module.component';
import { Weighting } from './weighting/weighting.component';

const GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

const base = ({
  subjects: [
    {
      title: 'Hauptfach',
      modules: [],
      percentage: 40,
      id: '09b3cd25-2cd1-47f3-8164-77604e766dc0',
    },
    {
      title: 'Nebenfach',
      modules: [],
      percentage: 40,
      id: 'f5e6d502-ba9a-4bf0-93bd-27b16e5e3ba8',
    },
    {
      title: 'Abschlussarbeit',
      modules: [],
      percentage: 20,
      id: '196885c5-e5f1-4bf9-b723-ac0cbadf3cf4',
    },
  ],
  papers: [],
} as unknown) as ISaveState;

interface ISaveState {
  subjects: Subject[];
  papers: Module[];
}

interface IDistribution {
  subject: Subject;
  outcomes: number[];
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public state: ISaveState = {
    subjects: new Array<Subject>(),
    papers: new Array<Module>(),
  };

  public labeledResults: { [key: string]: number } = {};

  constructor(private snackbar: MatSnackBar) {
    (window as any)['saveState'] = () => this.saveState();
    (window as any)['loadState'] = () => this.loadState();

    this.loadState();
  }

  get ungraded() {
    return this.state.subjects.filter(s => s.ungraded.length > 0).flatMap(s => s.ungraded);
  }

  get distMax() {
    return Math.max(...Object.values(this.labeledResults));
  }

  get distSize() {
    return Object.values(this.labeledResults).reduce((acc, val) => acc + val, 0);
  }

  get isOneHundred() {
    return this.state.subjects.reduce((acc, s) => acc + s.percentage, 0) === 100;
  }

  get hasSaveState() {
    return !!localStorage.getItem('saveState');
  }

  public getProbability(key: string) {
    return (100 * (this.labeledResults[key] / this.distSize)).toFixed(1) + '%';
  }

  public showMessage(message: string) {
    this.snackbar.open(message, 'OK Cool!', { duration: 3000 });
  }

  public loadState() {
    const savedSubjects = localStorage.getItem('saveState');
    this.state.subjects.splice(0, this.state.subjects.length);
    this.state.papers.splice(0, this.state.papers.length);
    const parsed = savedSubjects ? (JSON.parse(savedSubjects) as ISaveState) : base;
    this.state.subjects.push(...parsed.subjects.map(s => new Subject(s)));
    this.state.papers.push(...parsed.papers.map(s => new Module(s)));
    setTimeout(() => this.calculate(), 100);
    this.showMessage('Zustand geladen');
  }

  public saveState() {
    localStorage.setItem('saveState', JSON.stringify(this.state));
    this.showMessage('Zustand gespeichert');
  }

  public addSubject() {
    this.state.subjects.push(new Subject());
  }

  public removeSubject(subject: Subject) {
    const index = this.state.subjects.findIndex(s => s.id === subject.id);
    if (index < 0) return;
    this.state.subjects.splice(index, 1);
  }

  public addPaper() {
    this.state.papers.push(new Module());
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
    const weights = Weighting.all;
    const totalCredits = subject.totalCredits;
    const gradedSum = subject.graded.reduce(
      (acc, mod) => acc + mod.grade! * (mod.credits / totalCredits),
      0,
    );
    const outcomes = new Array<number>();
    for (const mod of subject.ungraded) {
      const weight = weights.find(w => w.moduleRef === mod.id)!;

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

  public calculate() {
    const dists = this.state.subjects.map(s => this.getSubjectDistribution(s));

    const walk = (sums: number[]): string[] => {
      const dist = dists.pop();
      if (!dist) return sums.map(s => s.toFixed(1));
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
}
