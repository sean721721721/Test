/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';

export default function userSimilarityGraph(data, svg, user) {
  console.log(user);
  console.log(data);
  svg.selectAll('*').remove();
  // svg.attr('viewBox', '0 0 960 500');
  // const h = parseFloat(d3.select('#timeLine').style('height'));
  // const w = parseFloat(d3.select('#timeLine').style('width'));
  // const xScaleWidth = w - 110;
  // const timePeriod = 1;
  // const timeScaleObjArr = [];
  // const color = d3.schemeTableau10;
  // const width = 500;
  // const height = 500;

  // const nodes = user.map(e => ({ name: e }));
  // console.log(nodes);
  // const userTotalReplyCount = data.map(e => e.totalReplyCount);
  // console.log(userTotalReplyCount);
  // const edges = computeUserSimilarity(data, user);
  // const edgesWeight = edges.map(e => e.value);
  // console.log(edges);
  // console.log(edgesWeight);
  // const linkWidthScale = d3.scaleLinear()
  //   .domain([Math.min(...edgesWeight), Math.max(...edgesWeight)])
  //   .range([0, 20]);
  // const linkStrengthScale = d3.scaleLinear()
  //   .domain([Math.min(...edgesWeight), Math.max(...edgesWeight)])
  //   .range([0, 1]);

  // const nodesSize = d3.scaleLinear()
  //   .domain([Math.min(...userTotalReplyCount), Math.max(...userTotalReplyCount)])
  //   .range([2, 10]);

  // const dataset = { nodes: data, edges };

  // svg = svg.append('g').attr('transform', 'scale(1, 1)');

  // const simulation = d3.forceSimulation()
  //   .force('link', d3.forceLink().id(d => d.id))
  //   .force('charge', d3.forceManyBody().strength(-1000))
  //   .force('center', d3.forceCenter(w / 2, h / 2));

  // const link = svg.selectAll('line')
  //   .data(dataset.edges)
  //   .enter()
  //   .append('line')
  //   .style('stroke', '#ccc')
  //   .style('stroke-opacity', 0.5)
  //   .style('stroke-width', d => linkWidthScale(d.value));

  // const node = svg.append('g')
  //   .attr('class', 'nodes')
  //   .selectAll('g')
  //   .data(dataset.nodes)
  //   .enter()
  //   .append('g');

  // const circles = node.append('circle')
  //   .attr('r', d => nodesSize(d.totalReplyCount))
  //   .attr('fill', (d, i) => color[i])
  //   .call(d3.drag()
  //     .on('start', dragstarted)
  //     .on('drag', dragged)
  //     .on('end', dragended));

  // const lables = node.append('text')
  //   .text(d => d.id)
  //   .attr('x', 6)
  //   .attr('y', 3);

  // node.append('title')
  //   .text(d => d.id);

  // simulation
  //   .nodes(dataset.nodes)
  //   .on('tick', ticked);

  // simulation.force('link')
  //   .links(dataset.edges)
  //   .distance(d => 50)
  //   // .strength(d => Math.min(1, 0.1 * d.value));
  //   .strength(d => linkStrengthScale(d.value));
  // set the dimensions and margins of the graph
  const margin = {
    top: 30, right: 30, bottom: 30, left: 30,
  };
  const width = 1300 - margin.left - margin.right;
  const height = 450 - margin.top - margin.bottom;

  // Labels of row and columns
  const myGroups = getAllAuthorId(data); // author
  const myVars = user;
  console.log(myGroups, myVars);

  // Build X scales and axis:
  const x = d3.scaleBand()
    .range([0, myGroups.length * 20])
    .domain(myGroups)
    .padding(0.05);
  svg.attr('width', myGroups.length * 20 + 60);
  svg = svg.append('g').attr('transform', 'translate(60,20)');
  svg.append('g')
    .attr('transform', `translate(0,${myVars.length * 20})`)
    .attr('class', 'authorAxisX')
    .call(d3.axisBottom(x));

  // Build X scales and axis:
  const y = d3.scaleBand()
    .range([myVars.length * 20, 0])
    .domain(myVars)
    .padding(0.05);
  svg.append('g').call(d3.axisLeft(y));

  // Build color scale
  const userColor = userColorScaleArray(data);
  console.log(userColor);
  const myColor = d3.scaleLinear()
    .range([d3.interpolateRdYlGn(0.4), d3.interpolateRdYlGn(0.1)])
    .domain([1, 10]);
  const scaleExponent = d3.scalePow().exponent(2);

  // Read the data
  svg.selectAll()
    .data(data)
    .enter()
    .each((d, i) => {
      svg.append('g')
        .attr('class', `${d.id}`)
        .selectAll('rect')
        .data(d.reply)
        .enter()
        .append('rect')
        .attr('x', d2 => x(d2.author))
        .attr('y', y(d.id))
        .attr('width', x.bandwidth())
        .attr('height', y.bandwidth())
        .style('fill', (d2) => {
          // console.log(d2.count, userColor[d.id](d2.count));
          return userColor[d.id](scaleExponent(d2.count));
        });
    });

  svg.selectAll('g.authorAxisX')
    .selectAll('text')
    .attr('y', 0)
    .attr('x', 9)
    .attr('dy', '.35em')
    .attr('transform', 'rotate(90)')
    .style('text-anchor', 'start');

  function getAllAuthorId(d) {
    const authorID = [];
    let authorList = [];
    d.forEach((usr) => {
      usr.reply.forEach((re) => {
        if (!authorList.some(e => e.id === re.author)) {
          authorList.push({ id: re.author, count: re.count });
        } else {
          authorList.find(e => e.id === re.author).count += re.count;
        }
      });
    });
    authorList = authorList.sort((a, b) => (a.count < b.count ? 1 : -1));
    authorList.forEach((e) => {
      authorID.push(e.id);
    });
    console.log(authorList);
    return authorID;
  }

  function userColorScaleArray(d) {
    const scaleArray = {};
    d.forEach((usr) => {
      scaleArray[usr.id] = d3.scaleLinear()
        .range([d3.interpolateYlOrRd(0.0), d3.interpolateYlOrRd(1)])
        .domain([1, usr.totalReplyCount]);
    });
    return scaleArray;
  }

  // function dragstarted(d) {
  //   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  //   d.fx = d.x;
  //   d.fy = d.y;
  // }

  // function dragged(d) {
  //   d.fx = d3.event.x;
  //   d.fy = d3.event.y;
  // }

  // function dragended(d) {
  //   if (!d3.event.active) simulation.alphaTarget(0);
  //   d.fx = null;
  //   d.fy = null;
  // }

  // function ticked() {
  //   link
  //     .attr('x1', d => d.source.x)
  //     .attr('y1', d => d.source.y)
  //     .attr('x2', d => d.target.x)
  //     .attr('y2', d => d.target.y);

  //   node
  //     .attr('transform', d => `translate(${d.x},${d.y})`);
  // }

  function computeUserSimilarity(userAuthorRelationShipArr, userArr) {
    const userListArray = [];
    for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
      const temp = userAuthorRelationShipArr[i];
      for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
        let linkValue = 0;
        const next = userAuthorRelationShipArr[j];
        temp.reply.forEach((e) => {
          const existedSameAuthor = next.reply.find(a => a.author === e.author);
          if (existedSameAuthor) {
            linkValue += e.count / temp.totalReplyCount;
            linkValue += existedSameAuthor.count / next.totalReplyCount;
          }
        });
        userListArray.push({ source: temp.id, target: next.id, value: linkValue });
      }
    }
    // userListArray = userListArray.filter(e => e.value >= 1);
    return userListArray;
  }
}

export { userSimilarityGraph };
