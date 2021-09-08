import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { Module } from '../module/module.component';
import { Weighting } from '../weighting/weighting.component';

export class Subject {
  static newSubjectEvent = new EventEmitter<Subject>();
  static Subjects = new Array<Subject>();

  title: string;
  modules: Module[];
  weightings: Weighting[];
  percentage: number;
  id: string;

  constructor(obj?: Partial<Subject>) {
    this.title = obj?.title ?? '';
    this.percentage = obj?.percentage ?? 0;
    this.modules = obj?.modules?.map(m => new Module(m)) ?? [];
    this.weightings = obj?.weightings?.map(w => new Weighting(w)) ?? [];
    this.id = obj?.id ?? uuid();

    Subject.Subjects.push(this);
    Subject.newSubjectEvent.emit(this);
  }

  get graded() {
    return this.modules.filter(m => m.grade);
  }

  get ungraded() {
    return this.modules.filter(m => !m.grade);
  }

  get totalCredits() {
    return this.modules.reduce((acc, val) => acc + val.credits, 0);
  }

  get percentageAsNum() {
    return this.percentage * 0.01;
  }

  public addModule() {
    const mod = new Module();
    this.modules.push(mod);
    this.weightings.push(new Weighting(mod));
  }

  public removeModule(mod: Module) {
    const modIndex = this.modules.findIndex(m => m.id === mod.id);
    const weightIndex = this.weightings.findIndex(w => w.moduleRef === mod.id);
    if (modIndex < 0 || weightIndex < 0) return;
    this.modules.splice(modIndex, 1);
    this.weightings.splice(weightIndex, 1);
  }
}

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.scss'],
})
export class SubjectComponent implements OnInit {
  @Output('subjectChanged')
  public subjectChanged = new EventEmitter<void>();

  @Input('subject')
  public subject!: Subject;

  constructor() {}

  ngOnInit(): void {}

  public emitChange() {
    this.subjectChanged.emit();
  }

  public addModule() {
    this.subject.addModule();
    this.emitChange();
  }

  public removeModule(mod: Module) {
    this.subject.removeModule(mod);
    this.emitChange();
  }
}
