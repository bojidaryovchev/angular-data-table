import { Component, OnInit } from '@angular/core';
import { DataType } from './modules/ngdatatable/components/responsive-table/responsive-table.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  tableHeaders = [
    {
      title: 'Name',
      dataType: DataType.String,
      property: 'name'
    },
    {
      title: 'Age',
      dataType: DataType.Number,
      property: 'age'
    },
    {
      title: 'Created',
      dataType: DataType.Date,
      property: 'created'
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
    }
  ];
  tableObjects: object[];

  ngOnInit() {
    this.tableObjects = this.initObjects(123456);
  }

  private initObjects(count: number): object[] {
    const objects = [];

    const names = ['John Locke', 'Jack', 'Kate', , 'Sawyer', 'Hugo', 'Jacob', 'Jin', 'Desmond', 'Sayid', 'Charlie', 'Ben Linus'];
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
        created: new Date(Math.floor(Math.random() * new Date().getTime()))
      });
    }

    return objects;
  }
}
