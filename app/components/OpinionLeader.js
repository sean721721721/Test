/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import React, { Component, PureComponent } from 'react';
// import PropTypes from 'prop-types';
// import { connect } from 'react-redux';
// import { push } from 'react-router-redux';
import * as d3 from 'd3';
// import * as sententree from 'sententree';
// import { max } from 'moment';
// import { Row, Form } from 'antd';
import netClustering from 'netclustering';

export default function OpinionLeader(cellNodes, cellLinks, beforeThisDate,
  svg, forceSimulation, totalInfluence) {
  // if (sliderHasBeenLoaded) {
  //   thisDate = d3.select('#customRange2').property('value');
  //   thisDate = timeScale.invert(beforeThisDate);
  // }
  console.log(cellNodes);
  console.log(cellLinks);
  const color = d3.schemeTableau10;
  const articleInfluenceThreshold = 100;
  const authorNodes = cellNodes.filter(node => node.influence);
  // const articleNodes = [];
  // authorNodes.map(e => e.responder).forEach((e) => {
  //   e.forEach((article) => {
  //     articleNodes.push(article);
  //   });
  // });
  const articleNodes = cellNodes.filter(node => node.type === 'article');

  console.log(articleNodes);
  console.log(authorNodes);

  const authorArr = authorNodes.map(node => node.id);

  const opinoinLeaderPie = d3.pie()
    .value((d) => {
      const totalComments = d.responder.reduce((pre, nex) => ({
        message: {
          length: pre.message.length + nex.message.length,
        },
      }));
      // console.log(d);
      return 360 / authorArr.length;
    })
    .sort(null);

  const articlePie = d3.pie()
    .value((d) => {
      const author = authorNodes.find(e => e.id === d.author);
      console.log(author);
      const articleRatio = author.responder.filter(e => e.message.length >= articleInfluenceThreshold);
      return (360 / authorArr.length) / articleRatio.length;
    })
    .sort(null);

  console.log(articlePie(articleNodes));

  responderCommunityDetecting(cellNodes, cellLinks);

  // ({ nodes, links } = data);
  svg.selectAll('*').remove();
  // svg = svg
  //   .call(d3.zoom().scaleExtent([1 / 2, 8]).on('zoom', articleCellZoomed))
  //   .append('g');
  svg = svg.append('g')
    .attr('transform', (d) => {
      const w = parseFloat(d3.select('#articleCell').style('width'));
      const h = parseFloat(d3.select('#articleCell').style('height'));
      return `translate(${w / 2}, ${h / 2}) scale(2,2)`;
    });
  let cellLink = svg.selectAll('line')
    .data(cellLinks);

  // link.exit().remove();
  const cellLinkEnter = cellLink.enter()
  // .append('g')
    .append('line')
    .attr('class', 'links')
    .style('z-index', -1)
  // .attr('visibility', 'hidden')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 1);
  // .attr('stroke-width', d => (d.value < 100000 ? d.value : 3));
  // cellLink = cellLinkEnter.merge(link);
  cellLink = cellLinkEnter;

  const cellPieGroup = svg.append('g')
    .attr('class', 'pieChart')
    .selectAll('g')
    .data([cellNodes])
    .enter();
  const cellPath = cellPieGroup.selectAll('path')
    .data((d) => {
      const res = d.filter(e => e.responder);
      return opinoinLeaderPie(res);
    });

  const arc = d3.arc()
    .innerRadius(135)
    .outerRadius(140);

  cellPath.enter().append('path')
    .attr('fill', (d) => {
      const index = authorArr.findIndex(e => e === d.data.id);
      // return color[index];
      return color[d.data.cluster];
    })
    .attr('d', arc)
    .attr('stroke', 'white')
    .attr('stroke-width', '0.2px');

  // const authorData = cellPath.data();
  // console.log(cellPath.enter().datum());
  // console.log(authorData);

  const articlePathGroup = cellPieGroup.append('g');
  const articlePath = articlePathGroup.selectAll('path')
    .data(articlePie(articleNodes));

  const articleArc = d3.arc()
    .innerRadius(130)
    .outerRadius(135);

  articlePath.enter().append('path')
    .attr('fill', (d) => {
      console.log(d);
      return 'white';
    })
    .attr('d', articleArc)
    .attr('stroke', 'black')
    .attr('stroke-width', '0.2px');

  cellPath.enter().append('text')
    .text(d => d.data.id)
    .attr('transform', (d) => {
      // console.log(d);
      if (d.data.id) {
        const author = cellNodes.find(e => e.id === d.data.id);
        // console.log(arc.centroid(d));
        [author.fx, author.fy] = arc.centroid(d);
      }
      return `translate(${arc.centroid(d)})`;
    })
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000');

  articlePath.enter().append('text')
    // .text(d => d.data.articleId)
    .attr('transform', (d) => {
      console.log(d);
      if (d.data.id) {
        const article = cellNodes.find(e => e.id === d.data.id);
        console.log(article);
        [article.fx, article.fy] = articleArc.centroid(d);
      }
      return `translate(${arc.centroid(d)})`;
    })
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000');

  console.log(cellNodes);

  let cellNode = svg.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(cellNodes);

  const cellNodeEnter = cellNode.enter()
    .append('g')
    .attr('class', 'nodes')
    .style('z-index', 1)
    .attr('opacity', (d) => {
      if (d.group !== 2 && d.connected === 0) return 0.2;
      if (d.show === 0) return 0.2;
      return 1;
    })
  // .on('click', clicked)
  // .on('mouseover', mouseOver(0.1))
  // .on('mouseout', mouseOut)
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  cellNodeEnter
    .append('defs')
    .append('pattern')
    .attr('id', 'pic_user')
    .attr('height', 60)
    .attr('width', 60)
    .attr('x', 0)
    .attr('y', 0)
    .append('image')
    .attr('xlink:href', 'https://i.imgur.com/jTUiJ1l.png')
    .attr('height', 10)
    .attr('width', 10)
    .attr('x', 0)
    .attr('y', 0);

  const cellKeyPlayerCircles = cellNodeEnter.selectAll('circle');

  const cellCircles = cellNodeEnter.append('circle')
    .transition()
    .duration(500)
    .attr('r', d => (d.group === 1 ? 0 : 1))
    .attr('fill', (d) => {
      if (d.reply) {
        if (d.reply.length === 1) {
          const index = authorArr.findIndex(e => e === d.reply[0].author.id);
          // return color[index];
          return color[d.cluster];
        }
        return 'green';
      }
      return 'green';
    })
    .style('fill-opacity', 1)
    .attr('stroke', 'gray')
    .attr('stroke-width', d => (d.group === 1 ? 2 : 0.9))
    .attr('stroke-opacity', 0);

  cellNodeEnter.on('mouseover', (d) => { mouseevent(d, 'mouseover'); })
    .on('mouseout', (d) => { mouseevent(d, 'mouseout'); });

  // const labelBox = cellNodeEnter.append('rect')
  //   .attr('x', 0)
  //   .attr('y', 0)
  //   .attr('width', 100)
  //   .attr('height', 50)
  //   .style('fill', '#80d6c7');

  const cellLables = cellNodeEnter.append('text')
    // .text(d => d.author)
    .style('text-anchor', 'middle')
    .attr('font-family', 'Microsoft JhengHei')
    .attr('font-size', '10px')
    .attr('color', '#000')
    .attr('y', 0);

  cellNodeEnter.append('title')
    .text(d => `Title: ${d.id}${'\n'}url: ${d.url}`);
  // cellNode = cellNodeEnter.merge(node);
  cellNode = cellNodeEnter;

  // const cellStrengthScale = d3.scaleLinear()
  //   .domain([
  //     Math.min(...set.links.map(l => l.value)),
  //     Math.max(...set.links.map(l => l.value)),
  //   ]).range([1, 100]);

  forceSimulation
    .nodes(cellNodes)
  // .on('tick', cellTicked)
    .on('tick', onSimulationTick);

  forceSimulation.alphaDecay(0.005)
    .force('link')
    .links(cellLinks)
    .distance(d => 10)
    .strength(d => d.value / 7);

  forceSimulation.force('collision', d3.forceCollide(1));

  const simulationDurationInMs = 3000; // 20 seconds

  const startTime = Date.now();
  const endTime = startTime + simulationDurationInMs;

  function onSimulationTick() {
    if (Date.now() < endTime) {
      cellTicked();
    } else {
      forceSimulation.stop();
    }
  }

  function cellTicked() {
    cellLink
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)
      .attr('class', d => (`from${d.source.index} to${d.target.index}`));

    cellNode
      .attr('transform', d => `translate( ${d.x}, ${d.y})`);
  }

  function dragstarted(d) {
    if (!d3.event.active) {
      forceSimulation.alphaTarget(0.3).restart();
    }
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
  }

  function dragended(d) {
    if (!d3.event.active) {
      forceSimulation.alphaTarget(0.3).restart();
    }
    d.fx = null;
    d.fy = null;
  }

  function mouseevent(d, event, mode) {
    const line_out_color = (event === 'mouseover') ? 'black' : 'rgb(208,211,212)';
    const line_in_color = (event === 'mouseover') ? 'rgb(218, 41, 28)' : 'rgb(208,211,212)';
    const line_opacity = (event === 'mouseover') ? 1 : 0.3;
    const dot_self_color = (event === 'mouseover') ? 'rgb(218, 41, 28)' : '#fff';
    const dot_other_color = (event === 'mouseover') ? 'black' : '#fff';
    const dot_selected_opacity = 1;
    const dot_other_opacity = (event === 'mouseover') ? 0.1 : 1;
    const dot_self_stroke_width = (event === 'mouseover') ? 2 : 1;

    // clear out
    d3.selectAll('circle.nodes').attr('r', e => e.radius).style('stroke', '#fff').style('stroke-width', dot_self_stroke_width);
    d3.selectAll('line').attr('marker-end', 'none').style('stroke', 'rgb(208,211,212)').style('stroke-opacity', 0.3);
    d3.selectAll('text.background-text').style('fill', 'rgb(208,211,212)').style('stroke', 'rgb(208,211,212)');

    // color lines
    d3.selectAll(`line.to${d.index}`).each((e) => {
      e.type = 'in';
    })
      .attr('marker-end', e => ((event === 'mouseover') ? `url(#${e.type})` : 'none'))
      .style('stroke', line_in_color)
      .transition()
      .duration(500)
      .style('stroke-opacity', line_opacity);

    d3.selectAll(`line.from${d.index}`).each((e) => {
      e.type = 'out';
    })
      .attr('marker-end', e => ((event === 'mouseover') ? `url(#${e.type})` : 'none'))
      .style('stroke', line_out_color)
      .transition()
      .duration(500)
      .style('stroke-opacity', line_opacity);

    // highlight dots
    d3.selectAll('circle.nodes').transition().style('opacity', dot_other_opacity);
    // self
    d3.selectAll(`circle#_${d.index}`)
      .style('stroke', dot_self_color)
      .transition()
      .duration(800)
    // .attr('r', e => ((event === 'mouseover') ? node_r(e.highlight_mode) : node_r(e.normal_mode)))
      .style('opacity', dot_selected_opacity)
      .style('stroke-width', dot_self_stroke_width);
    // to dots
    d3.selectAll(`line.from${d.index}`).filter(e => e.target.index !== e.source.index).each((e) => {
      if (event === 'mouseover') {
        d3.select(`circle#_${e.target.index}`)
          .style('stroke', dot_other_color)
        // .attr('r', e1 => ((event === 'mouseover') ? node_r(e.count) : e1.radius))
          .each((e1) => {
            e1.select_radius = d3.select(this).attr('r');
          })
          .transition()
          .duration(300)
          .style('opacity', dot_selected_opacity);
      } else {
        d3.select(`circle#_${e.target.index}`)
          .attr('r', e1 => e1.radius)
          .style('stroke', dot_other_color)
          .style('opacity', dot_selected_opacity);
      }
    });
    // from dots
    d3.selectAll(`line.to${d.index}`).filter(e => e.target.index !== e.source.index).each((e) => {
      d3.select(`circle#_${e.source.index}`)
      // .attr('r', e1 => ((event === 'mouseover') ? node_r(e.count) : e1.radius))
        .each((e1) => {
          e1.select_radius = d3.select(this).attr('r');
        })
        .style('stroke', dot_other_color)
        .transition()
        .duration(300)
        .style('opacity', dot_selected_opacity);
    });
  }

  function responderCommunityDetecting(dataNodes, dataLinks) {
    const filteredLinks = dataLinks.filter(l => l.tag === 1);
    const links = JSON.parse(JSON.stringify(filteredLinks));
    for (let i = 0; i < links.length; i += 1) {
      // console.log(links[i]);
      links[i].source = dataNodes.findIndex(ele => ele.id === filteredLinks[i].source);
      links[i].target = dataNodes.findIndex((ele) => {
        // console.log(ele.id, dataLinks[i].target, ele.id === dataLinks[i].target.id);
        return ele.id === filteredLinks[i].target.id;
      });
    }
    const index = dataNodes.findIndex(ele => ele.id === 'sonofgod');
    const testLinks = links.filter(l => l.source === 270);
    // console.log(index, testLinks);
    // console.log(dataNodes, dataLinks, links);
    netClustering.cluster(dataNodes, links);
  }

  // function communityDetecting() {
  //   const l = JSON.parse(JSON.stringify(set.links));
  //   // console.log(links);
  //   for (let i = 0; i < l.length; i += 1) {
  //     // console.log(links[i]);
  //     l[i].source = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].source);
  //     l[i].target = set.nodes.findIndex(ele => ele.titleTerm === set.links[i].target);
  //   }
  //   netClustering.cluster(set.nodes, l);
  // }
}

export { OpinionLeader };
