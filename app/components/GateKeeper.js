/* eslint-disable no-use-before-define */
/* eslint-disable no-console */
import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import * as d3 from 'd3';

class GateKeeper extends Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.state = props;
  }

  componentDidMount() {
    console.log('componentDidMount');
  }

  componentDidUpdate() {
    this.drawwithlabels();
    console.log('componentDidUpdate');
  }

  drawwithlabels() {
    const { gatekeeperprops } = this.state;
    const { ptt, news } = gatekeeperprops;
    console.log(news, ptt);
    const svg = d3.select(this.myRef.current)
      .select('svg');
    const width = document.getElementById('gate').clientWidth;
    // const height = document.getElementById('gate').clientHeight;
    const min = new Date('2019-04-25T04:25:50.000Z');
    const max = new Date('2019-05-10T04:30:50.000Z');
    const xScale = d3.scaleTime().domain([min, max]).range([0, 100]);
    const colorScale = d3.scaleLinear().domain([0, 1]).range([0.0, 0.5]);
    const color = d3.interpolateSinebow;
    d3.select(this.myRef.current).select('p').selectAll('*').remove();

    const nevigator = d3.select(this.myRef.current).select('p');
    nevigator.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('x', '50%')
      .attr('y', '10%')
      .text('Date: ');

    const slider = nevigator.append('input');
    slider.datum({})
      .attr('type', 'range')
      .attr('value', new Date('2019-05-01T04:25:50.000Z'))
      .attr('min', new Date('2019-04-25T04:25:50.000Z'))
      .attr('max', new Date('2019-05-10T04:25:50.000Z'))
      .attr('step', 1)
      .on('input', update);

    nevigator.append('text')
      .attr('id', 'date')
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('x', '50%')
      .attr('y', '10%')
      .text('Date: ');

    function update() {
      svg.selectAll('*').remove();

      let time = d3.select(this).property('value');
      time = xScale.invert(time);
      // console.log('time: ', time);

      const formatTime = d3.timeFormat('%B %d, %Y');
      nevigator.select('#date')
        .text(formatTime(time));

      const text = svg.append('text');
      text.attr('text-anchor', 'middle')
        .attr('font-size', '24px')
        .attr('x', '50%')
        .attr('y', '10%')
        .text('新聞守門觀察員');

      const spectrums = svg.append('g');
      spectrums.attr('transform', `translate(${width / 2 - 270}, -100) scale(1.2,1.2)`);
      const newsImg = spectrums.append('image');
      newsImg.attr('x', '0')
        .attr('y', '170')
        .attr('width', 40)
        .attr('height', 40)
        .attr('xlink:href', 'https://imgur.com/YzN5Pbe.png')
        .attr('width', 40)
        .attr('height', 40);

      const pttImg = spectrums.append('image');
      pttImg.attr('x', '0')
        .attr('y', '330')
        .attr('width', 40)
        .attr('height', 40)
        .attr('xlink:href', 'https://g.rimg.com.tw/s2/5/fe/c0/21904686479040_275_m.jpg')
        .attr('width', 40)
        .attr('height', 40);

      const arrowImg = spectrums.append('image');
      arrowImg.attr('x', '15%')
        .attr('y', '50%')
        .attr('width', '80%')
        .attr('height', 40)
        .attr('xlink:href', 'https://img.88tph.com/production/20180117/12464613-1.jpg!/watermark/url/L3BhdGgvbG9nby5wbmc/align/center')
        .attr('width', '80%')
        .attr('height', 40)
        .attr('transform', 'scale(3,1)');

      const x = d3.scaleLinear().range([0, 300]);
      x.domain([0, 1]);

      const pttScores = spectrums.selectAll('line').data(ptt);
      pttScores.enter().append('line')
        .attr('transform', 'translate(110,0)')
        .attr('x1', d => x(d.value))
        .attr('x2', d => x(d.value))
        .attr('y1', '345')
        .attr('y2', '355')
        // .attr('visibility', (d) => {
        //   if (new Date(d.date) <= new Date(time)) {
        //     return 'none';
        //   }
        //   return 'hidden';
        // })
        .style('stroke', (d) => {
          let diff = Math.abs(new Date(d.date) - new Date(time));
          diff /= (max - min);
          return color(colorScale(diff));
        })
        .style('stroke-width', 2);

      const newsScores = pttScores;
      newsScores.data(news).enter()
        .append('line')
        .attr('transform', 'translate(110,0)')
        .attr('x1', d => x(d.value))
        .attr('x2', d => x(d.value))
        .attr('y1', '185')
        .attr('y2', '195')
        // .attr('visibility', (d) => {
        //   if (new Date(d.date) <= new Date(time)) {
        //     return 'none';
        //   }
        //   return 'hidden';
        // })
        .style('stroke', (d) => {
          let diff = Math.abs(new Date(d.date) - new Date(time));
          diff /= (max - min);
          return color(colorScale(diff));
        })
        .style('stroke-width', 2);

      const newsSpectrum = spectrums.append('g').attr('transform', 'translate(110,0)');
      newsSpectrum.append('line')
        .attr('x1', x(0) - 1)
        .attr('x2', x(0) - 1)
        .attr('y1', '185')
        .attr('y2', '195')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      newsSpectrum.append('line')
        .attr('x1', x(1) + 1)
        .attr('x2', x(1) + 1)
        .attr('y1', '185')
        .attr('y2', '195')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      newsSpectrum.append('line')
        .attr('x1', x(0) - 1)
        .attr('x2', x(1) + 1)
        .attr('y1', '185')
        .attr('y2', '185')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      newsSpectrum.append('line')
        .attr('x1', x(0) - 1)
        .attr('x2', x(1) + 1)
        .attr('y1', '195')
        .attr('y2', '195')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      const pttSpectrum = spectrums.append('g').attr('transform', 'translate(110,0)');
      pttSpectrum.append('line')
        .attr('x1', x(0) - 1)
        .attr('x2', x(0) - 1)
        .attr('y1', '345')
        .attr('y2', '355')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      pttSpectrum.append('line')
        .attr('x1', x(1) + 1)
        .attr('x2', x(1) + 1)
        .attr('y1', '345')
        .attr('y2', '355')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      pttSpectrum.append('line')
        .attr('x1', x(0) - 1)
        .attr('x2', x(1) + 1)
        .attr('y1', '345')
        .attr('y2', '345')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      pttSpectrum.append('line')
        .attr('x1', x(0) - 1)
        .attr('x2', x(1) + 1)
        .attr('y1', '355')
        .attr('y2', '355')
        .style('stroke', 'black')
        .style('stroke-width', 2);

      // Add the x Axis
      const axisX = spectrums;

      axisX.append('g')
        .attr('transform', 'translate(110,356)')
        .call(d3.axisBottom(x))
        .attr('fill', 'none')
        .attr('stroke', 'black');

      axisX.append('g')
        .attr('transform', 'translate(110,196)')
        .call(d3.axisBottom(x))
        .attr('fill', 'none')
        .attr('stroke', 'black');

      // text label for the x axis
      spectrums.append('text')
        .attr('transform', `translate(${20},${55})`)
        .style('text-anchor', 'middle')
        .text('score');
    }
  }


  render() {
    return (
      <div style={{ height: '100%' }} ref={this.myRef}>
        <p />
        <svg width="100%" height="100%" id="gate">
          <text style={{ textAnchor: 'middle', fontSize: '24px' }} x="50%" y="10%">新聞守門觀察員</text>
          {/* <image x="15%" y="30%" width="40px" height="40px" href="https://imgur.com/YzN5Pbe.png" /> */}
          {/* <image x="15%" y="70%" width="40px" height="40px" href="https://g.rimg.com.tw/s2/5/fe/c0/21904686479040_275_m.jpg" /> */}
        </svg>
      </div>
    );
  }
}


export default GateKeeper;
