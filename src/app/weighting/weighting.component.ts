import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Module } from '../module/module.component';
import { Subject } from '../subject/subject.component';

const GRADES = [1.0, 1.3, 1.7, 2.0, 2.3, 2.7, 3.0, 3.3, 3.7, 4.0];

export class Weighting {
  static all = new Array<Weighting>();

  best = 1.0;
  worst = 4.0;
  likely = 2.0;

  moduleRef: string;

  constructor(mod: Module) {
    this.moduleRef = mod.id;
    Weighting.all.push(this);
  }
}

@Component({
  selector: 'app-weighting',
  templateUrl: './weighting.component.html',
  styleUrls: ['./weighting.component.scss'],
})
export class WeightingComponent implements OnInit {
  @Output('weightChanged')
  public weightChanged = new EventEmitter<void>();

  @Input('module')
  public mod!: Module;

  @Input('subject')
  public subject?: Subject;

  public weighting?: Weighting;

  public possibleGrades = GRADES;

  constructor() {}

  ngOnInit(): void {
    this.subject = Subject.Subjects.find(s => !!s.modules.find(m => m.id === this.mod.id))!;
    this.weighting = new Weighting(this.mod);
  }

  get title() {
    return `${this.subject?.title} - ${this.mod.title}`;
  }

  public emitChange() {
    this.weightChanged.emit();
  }
}
