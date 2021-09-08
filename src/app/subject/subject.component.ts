import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { Module } from '../module/module.component';
import { Weighting } from '../weighting/weighting.component';

export class Subject {
  static newSubjectEvent = new EventEmitter<Subject>();
  static Subjects = new Array<Subject>();

  title: string = '';
  modules: Module[] = new Array<Module>();
  percentage: number = 0;
  id = uuid();

  constructor(obj?: Subject) {
    if (obj) {
      this.title = obj.title;
      this.percentage = obj.percentage;
      this.modules = obj.modules.map(m => new Module(m));
      this.id = obj.id;
    }

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
    this.subject.modules.push(new Module());
    this.emitChange();
  }

  public removeModule(mod: Module) {
    const index = this.subject.modules.findIndex(m => m.id === mod.id);
    if (index < 0) return;
    this.subject.modules.splice(index, 1);
    Weighting.removeByRef(mod);
    this.emitChange();
  }
}
