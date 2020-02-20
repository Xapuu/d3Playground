import { Component, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { tableSrc } from '../table-src';
import { table1 } from '../data';
import { table4 } from '../data';
import { config4 } from '../data';

import * as d3 from 'd3';
import { DataService } from '../data-service/data.service';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
@Component({
  selector: 'app-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnInit, OnDestroy {


  @ViewChild('table', { static: true }) table: ElementRef;
  @ViewChild('svg', { static: true }) svg: ElementRef;

  constructor(private data: DataService) {
    console.log(this.data.getDataArray(3));
  }


  title = 'd3Charts';
  // dataSource = table4.map(({ field, source, device_id, subsystem_id, controller_instance }) => ({
  //   field,
  //   source: source.map(({ mean, time }) => ({
  //     mean,
  //     time: new Date(time)
  //   })),
  //   device_id,
  //   subsystem_id,
  //   controller_instance
  // }));

  dataSource = this.data.getDataArray(1);




  series = config4.series;
  yAxisLabel = config4.yAxis[1].name;


  hoveredData;
  height = 600;
  width = 1000;

  colors = ['steelblue', 'red', 'orange', 'pink', 'green', 'lime', 'aqua', 'black'];

  liveDataToggle$ = new Subject();


  stopLive() {
    this.liveDataToggle$.next();
  }

  goLive() {
    const lastMean = this.dataSource[0].source[this.dataSource[0].source.length - 1].mean;

    this.data
      .getLiveData(lastMean)
      .pipe(takeUntil(this.liveDataToggle$))
      .subscribe(x => {
        console.log(x);

        this.dataSource[0].source.shift();
        this.dataSource[0].source.push(x[0]);
      });
  }

  ngOnInit() {


    // const dataBox = d3.select('.data-box');
    const dataBox = d3.select(this.table.nativeElement);

    const svgWidth = 1000;
    const svgHeight = 600;
    const margin = { top: 20, right: 20, bottom: 30, left: 50 };
    const width = svgWidth - margin.left - margin.right;
    const height = svgHeight - margin.top - margin.bottom;

    const svg = d3.select(this.svg.nativeElement)
      .attr('width', svgWidth)
      .attr('height', svgHeight);

    const g = svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

    const x = d3.scaleTime()
      .domain([
        this.dataSource[0].source[0].time,
        this.dataSource[0].source[this.dataSource[0].source.length - 1].time
      ])
      .rangeRound([0, width]);

    x.domain(d3.extent(this.dataSource[0].source, (d) => d.time));


    /**
     * Generates the y axis
     */
    const y = d3.scaleLinear()
      .range([height, 0]);
    // Set the y axis labels
    y.domain([0, 300])
      .nice();
    const yAxisGenerator = d3.axisLeft(y);
    yAxisGenerator.ticks(5);
    yAxisGenerator.tickFormat((d, i) => d + ' V');

    const yAxis = g.append('g')
      .call(yAxisGenerator);

    // Time format
    const formatTime = d3.timeFormat('%B %d, %Y');
    g.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(
        d3.axisBottom(x)
          .tickFormat(
            (y) => {
              console.log(y);
              return formatTime(new Date(y as any));
            }))
      .select('.domain')
      .remove();

    const line = d3.line<{ time: Date, mean: number }>()
      .x((d) => x(d.time))
      .y((d) => y(d.mean));


    this.dataSource.forEach((data, i) => {
      g.append('path')
        .datum(data.source)
        .attr('fill', 'none')
        .attr('stroke', this.colors[i % this.colors.length])
        .attr('stroke-linejoin', 'round')
        .attr('stroke-linecap', 'round')
        .attr('stroke-width', 2)
        .attr('d', line);
    });

    console.log(x, ' < info for x');
    console.log(y, ' <= info for y');

    this.showData(this.dataSource, svg, height, width, margin, dataBox, y, x);
  }


  writeData(date) {
    this.hoveredData = this.dataSource.map(({ field, source }) => ({
      field,
      nodeResult: source.find((x, i, arr) =>
        date.getTime() === x.time.getTime()
        || date.getTime() < arr[i + 1].time.getTime())
    }));
  }

  showData(data, svg, height, width, margin, dataBox, yScale, xScale) {
    svg.append('div').text('Hello');

    const mouseG = svg.append('g')
      .attr('class', 'mouse-over-effects');

    const canvas = d3.select('.line-chart');

    const x = mouseG.append('line') // this is the black vertical line to follow mouse
      .style('stroke', 'black')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('x1', '0')
      .attr('x2', width);


    const y = mouseG.append('line') // this is the black vertical line to follow mouse
      .style('stroke', 'black')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('y1', '0')
      .attr('y2', height);



    const yText = mouseG.append('g');
    const yTextHandler = yAxisTextBox(yText);

    const xText = mouseG.append('g');
    const xTextHandler = xAxisTextBox(xText);


    const container = svg
      .append('svg:rect')
      // .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .attr('opacity', '0')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .attr('width', width)
      .attr('height', height);

    const formatTime = d3.timeFormat('%B %d, %Y');

    container.on('mousemove',
      () => { // mouse moving over canvas
        const mouse = d3.mouse(container.node());
        y.attr('x1', mouse[0])
          .attr('x2', mouse[0])
          .attr('opacity', 1);
        x.attr('y1', mouse[1])
          .attr('y2', mouse[1])
          .attr('opacity', 1);

        dataBox.style('display', 'block');
        dataBox.style('left', mouse[0] >= width / 2 ? '70px' : 'initial');
        dataBox.style('right', mouse[0] >= width / 2 ? 'initial' : '70px');

        yTextHandler.mouseMove(mouse[0], mouse[1], yScale.invert(mouse[1]).toFixed(2));
        xTextHandler.mouseMove(mouse[0], mouse[1], formatTime(xScale.invert(mouse[0])));

        this.writeData(xScale.invert(mouse[0]));
      })
      .on('mouseout', () => {
        y.attr('opacity', 0);
        x.attr('opacity', 0);
        yTextHandler.mouseOut();
        xTextHandler.mouseOut();
        dataBox.style('display', 'none');
      });
  }

  ngOnDestroy() {
    this.liveDataToggle$.next();
  }
}



function xAxisTextBox(textBoxRef) {
  const textXBase = 600;
  const boxYBase = 609;

  const box = textBoxRef
    .append('svg:rect')
    .attr('x', 0)
    .attr('y', textXBase)
    .attr('fill', 'black')
    .attr('width', '100')
    .attr('height', '20');
  // .attr('display', 'none');
  const text = textBoxRef
    .append('svg:text')
    .attr('x', 0)
    .attr('y', textXBase)
    // .attr('fill', 'white')
    .text('hello');
  // .attr('display', 'none');

  return {
    mouseMove(x, y, newText) {
      text
        .attr('display', 'initial')
        .attr('x', x)
        .text(newText);
      box
        .attr('display', 'initial')
        .attr('x', x);
    },
    mouseOut() {
      // text.attr('display', 'none');
      // box.attr('display', 'none');

    }
  };



}
function yAxisTextBox(textBoxRef) {
  const textYBase = 24;
  const boxYBase = 9;

  const box = textBoxRef
    .append('svg:rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('fill', 'black')
    .attr('width', '50')
    .attr('height', '20')
    .attr('display', 'none');
  const text = textBoxRef
    .append('svg:text')
    .attr('x', 10)
    .attr('y', textYBase)
    .attr('fill', 'white')
    .text('hello');
  // .attr('display', 'none');

  return {
    mouseMove(x, y, newText) {
      text
        .attr('display', 'initial')
        .attr('y', y + textYBase)
        .text(newText);
      box
        .attr('display', 'initial')
        .attr('y', y + boxYBase);
    },
    mouseOut() {
      text.attr('display', 'none');
      box.attr('display', 'none');

    }
  };
}
