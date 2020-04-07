import { Component, OnInit, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { DataType, TableHeader } from './modules/ngdatatable/components/responsive-table/responsive-table.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  @ViewChild('template', { static: true }) template: TemplateRef<ElementRef<HTMLElement>>;

  tableObjects: object[];

  ngOnInit() {
    this.tableObjects = this.initObjects(123456);
  }

  get tableHeaders(): TableHeader[] {
    return [
      {
        title: 'Name and Surname and Something Very Long Blablabla',
        dataType: DataType.String,
        property: 'name'
      },
      {
        title: 'Age',
        dataType: DataType.Number,
        property: 'age'
      },
      {
        title: 'Template',
        dataType: DataType.Template,
        template: this.template
      },
      {
        title: 'Property A',
        dataType: DataType.Number,
        property: 'a'
      },
      {
        title: 'Property B',
        dataType: DataType.Number,
        property: 'b'
      },
      {
        title: 'Property C',
        dataType: DataType.Number,
        property: 'c'
      },
      {
        title: 'Property D',
        dataType: DataType.Number,
        property: 'd'
      },
      {
        title: 'Property E',
        dataType: DataType.Number,
        property: 'e'
      },
      {
        title: 'Property F',
        dataType: DataType.Number,
        property: 'f'
      },
      {
        title: 'Property G',
        dataType: DataType.Number,
        property: 'g'
      },
      {
        title: 'Property I',
        dataType: DataType.Number,
        property: 'i'
      },
      {
        title: 'Property J',
        dataType: DataType.Number,
        property: 'j'
      },
      {
        title: 'Property K',
        dataType: DataType.Number,
        property: 'k'
      }
    ];
  }

  private getRandomNumber = max => Math.floor(Math.random() * max);
  private getRandomColor = () => `rgb(${this.getRandomNumber(256)}, ${this.getRandomNumber(256)}, ${this.getRandomNumber(256)})`;

  private initObjects(count: number): object[] {
    const objects = [];

    const names = ['John Locke', 'Jack', 'Kate', 'Sawyer', 'Hugo', 'Jacob', 'Jin', 'Desmond', 'Sayid', 'Charlie', 'Ben Linus'];
    const multiplyString = (string, count) => {
      const multiplied = [];

      for (let i = 0; i < count; i++) {
        multiplied.push(string);
      }

      return multiplied.join(' ');
    };

    for (let index = 0; index < count; index++) {
      const name = multiplyString(`${names[Math.floor(Math.random() * names.length)]} ${index}`, 10);

      objects.push({
        name,
        age: Math.floor(Math.random() * index),
        a: Math.floor(Math.random() * index),
        b: Math.floor(Math.random() * index),
        c: Math.floor(Math.random() * index),
        d: Math.floor(Math.random() * index),
        e: Math.floor(Math.random() * index),
        f: Math.floor(Math.random() * index),
        g: Math.floor(Math.random() * index),
        h: Math.floor(Math.random() * index),
        i: Math.floor(Math.random() * index),
        j: Math.floor(Math.random() * index),
        k: Math.floor(Math.random() * index),
        created: new Date(Math.floor(Math.random() * new Date().getTime())),
        color: this.getRandomColor()
      });
    }

    return objects;
  }
}
