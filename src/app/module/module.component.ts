import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { Subject } from '../subject/subject.component';

const GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

export class Module {
  static newModuleEvent = new EventEmitter<Module>();

  title: string = '';
  credits: number = 12;
  grade: number | undefined = undefined;
  id = uuid();

  constructor(obj?: Module) {
    if (obj) {
      this.title = obj.title;
      this.credits = obj.credits;
      this.grade = obj.grade;
      this.id = obj.id;
    }
    Module.newModuleEvent.emit(this);
  }
}

@Component({
  selector: 'app-module',
  templateUrl: './module.component.html',
  styleUrls: ['./module.component.scss'],
})
export class ModuleComponent implements OnInit {
  @Output('moduleChanged')
  public moduleChanged = new EventEmitter<void>();

  @Input('module')
  public mod!: Module;

  @Input('subject')
  public subject!: Subject;

  public possibleGrades = GRADES;

  constructor() {}

  public emitChange() {
    this.moduleChanged.emit();
  }

  ngOnInit(): void {}
}
