/* eslint-disable max-len */
/* eslint-disable no-loop-func */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-console */
/* eslint-disable linebreak-style */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
/* eslint-disable no-use-before-define */
/* eslint-disable camelcase */
/* eslint-disable no-param-reassign */
import * as d3 from 'd3';
import * as slider from 'd3-simple-slider';

export default function userDailyActivity(data, user, svg, begin, end) {
  // console.log(user);
  // console.log(data);
  // console.log(begin);
  svg.selectAll('*').remove();
  const h = parseFloat(d3.select('.commentTimeline').style('height'));
  const w = parseFloat(d3.select('.commentTimeline').style('width'));
  let original_date1 = new Date(begin);
  original_date1.setHours(0, 0, 0);
  let original_date2 = new Date(end);
  original_date2.setHours(23, 59, 59);
  console.log(original_date1, original_date2);
  let filteredArticles = [];
  // Range
  d3.select('div#slider-range').select('svg').remove();
  const sliderRange = slider.sliderBottom()
    .min(original_date1)
    .max(original_date2)
    .width(300)
    .tickFormat(d3.timeFormat('%m/%d %H'))
    .ticks(5)
    .default([original_date1, original_date2])
    .fill('#2196f3')
    .on('onchange', (val) => {
      update(new Date(val[0]), new Date(val[1]));
      original_date1 = new Date(val[0]);
      original_date2 = new Date(val[1]);
    });

  const gRange = d3
    .select('div#slider-range')
    .append('svg')
    .attr('width', 500)
    .attr('height', 30)
    .append('g')
    .attr('transform', 'scale(0.8) translate(20,10)');

  gRange.call(sliderRange);
  gRange.select('.axis')
    .attr('transform', 'translate(0, 0)')
    .selectAll('text')
    .attr('y', 10);
  gRange.selectAll('.parameter-value')
    .selectAll('text')
    .attr('y', 15);
  d3.select('p#value-range').text('Time Range')
    .style('text-align', 'right');

  //----------------

  svg.selectAll('*').remove();
  const gridSize = 12;
  const userListByReplyCountPerHours = computeUserListByReplyCountPerHours(data, user);
  // console.log(userListByReplyCountPerHours);
  const color = d3.schemeTableau10;
  const myColor = d3.scaleLinear()
    .range([d3.interpolateYlGn(0), d3.interpolateYlGn(0.8)])
    .domain([0, 10]);
  const xScale = getXScale(original_date1, original_date2);
  const timeScale = d3.scaleTime().domain([original_date1, original_date2]).range([0, 500]);
  const userScaleRange = user.length * 10;
  const userScale = d3.scaleBand().domain(user).range([0, userScaleRange]);
  const yDomain = getYDomain(original_date1, original_date2);
  // console.log(yDomain);
  const xDomain = oneToNArray(24);
  const x = d3.scaleBand()
    .range([0, 24 * gridSize])
    .domain(xDomain)
    .padding(0.05);
  const y = d3.scaleBand()
    .range([0, yDomain.length * gridSize])
    .domain(yDomain)
    .padding(0.05);
  const Tooltip = d3.select('.tooltip');
  const mouseover = (d, e) => {
    if (e) {
      Tooltip
        .style('opacity', 1)
        .html(`<p style="color: white;">${d.article_title} <br> ${e.push_tag} ${e.push_userid}: ${e.push_content}</p>`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY}px`);
      d3.select(this)
        .style('stroke', 'black')
        .style('opacity', 1);
    } else {
      Tooltip
        .style('opacity', 1)
        .html(`<p style="color: white;">Title: ${d.article_title}</p>`)
        .style('left', `${d3.event.pageX + 25}px`)
        .style('top', `${d3.event.pageY}px`);
      fixedSvg.selectAll('.article')
        .attr('opacity', '0');
      const articleId = d.article_id.replace(/\./gi, '');
      fixedSvg.selectAll(`.articleID_${articleId}`)
        .attr('opacity', '1');
    }
  };
  const mouseout = (d) => {
    fixedSvg.selectAll('.article')
      .attr('opacity', 1);

    Tooltip
      .style('opacity', 0)
      .style('left', '0px')
      .style('top', '0px');
    d3.select(this)
      .style('stroke', 'none')
      .style('opacity', 0.8);
  };

    // const legends = svg.append('g').attr('transform', 'translate(50,25)');
    // legends.selectAll('mydots')
    //   .data(user)
    //   .enter()
    //   .append('circle')
    //   .attr('cx', (d, i) => i * 100)
    //   .attr('cy', 0)
    //   .attr('r', 7)
    //   .style('fill', (d, i) => color[i]);

    // legends.selectAll('mylabels')
    //   .data(user)
    //   .enter()
    //   .append('text')
    //   .attr('x', (d, i) => 12 + i * 100)
    //   .attr('y', 0)
    //   .style('fill', (d, i) => color[i])
    //   .text(d => d)
    //   .attr('font-size', '12px')
    //   .attr('text-anchor', 'left')
    //   .style('alignment-baseline', 'middle');

  svg.attr('height', `${200 + user.length * (yDomain.length + 5) * gridSize}`);
  const userOffset = 0;
  // for (let i = 0; i < userListByReplyCountPerHours.length; i += 1) {
  //   if (i !== 0) {
  //     userOffset = userOffset + yDomain.length + 10;
  //   }
  // svg.append('g')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(200, 100)';
  //     return `translate(200, ${userOffset * gridSize + 100})`;
  //   })
  //   .selectAll()
  //   .data(userListByReplyCountPerHours[i].time)
  //   .enter()
  //   .append('rect')
  //   // .attr('x', (d, index) => x(d.hours))
  //   .attr('x', (d, index) => x(d.hours))
  //   // eslint-disable-next-line no-loop-func
  //   .attr('y', d => y(`${d.month + 1}/${d.date}`))
  //   .attr('width', x.bandwidth())
  //   .attr('height', x.bandwidth())
  //   .style('fill', d => myColor(d.reply.length))
  //   .attr('border', '0.5px solid black')
  //   .on('mouseover', d => mouseover(data[i], d))
  //   .on('mouseout', mouseout);
  const fixedSvg = svg.append('g')
    .attr('transform', 'translate(100, 40)');
  for (let i = 0; i < user.length; i += 1) {
    fixedSvg.append('g')
      .selectAll()
      .data(user)
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', d => userScale(d))
      .attr('width', timeScale.range()[1])
      .attr('height', userScale.bandwidth())
      .attr('stroke', 'black')
      .attr('stroke-width', '0.3px')
      .style('fill', (d, index) => (index % 2 ? 'white' : 'gainsboro'));
  }

  for (let i = 0; i < data.length; i += 1) {
    if (data[i].messages.some(mes => user.includes(mes.push_userid))) {
      const articleId = data[i].article_id.replace(/\./gi, '');
      fixedSvg.append('g')
        .attr('class', `pointer articleID_${articleId}`)
        .attr('transform', 'translate(0, -10)')
        .selectAll()
        .data([data[i]])
        .enter()
        .each((d, index, nodes) => {
          d3.select(nodes[index]).append('rect')
            .attr('x', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime);
            })
            .attr('opacity', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime) < 500 ? 1 : 0;
            })
            .attr('y', 0)
            .attr('width', 2)
            .attr('height', 10)
            .style('fill', color[0])
            .on('mouseover', _d => mouseover(_d))
            .on('mouseout', mouseout);
          d3.select(nodes[index]).append('circle')
            .attr('cx', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime) + 1;
            })
            .attr('opacity', (_d) => {
              const postTime = new Date(_d.date);
              return timeScale(postTime) < 500 ? 1 : 0;
            })
            .attr('cy', 0)
            .attr('r', 4)
            .style('fill', color[0])
            .on('mouseover', _d => mouseover(_d))
            .on('mouseout', mouseout);
        });

      const postYear = new Date(data[i].date).getFullYear();
      const filteredMessages = data[i].messages.filter(e => user.includes(e.push_userid));
      fixedSvg.append('g')
        .attr('class', `article articleID_${articleId}`)
        .selectAll()
        .data(filteredMessages)
        .enter()
        .append('rect')
        .attr('x', (d, index) => {
          // const date = dateFormat(d);
          // const commentTime = new Date(new Date(date).setFullYear(postYear));
          // return timeScale(commentTime);
          const postTime = new Date(data[i].date);
          return timeScale(postTime);
        })
        .attr('opacity', (d, index) => {
          // const date = dateFormat(d);
          // const commentTime = new Date(new Date(date).setFullYear(postYear));
          // return timeScale(commentTime) < 500 ? 1 : 0;
          const postTime = new Date(data[i].date);
          return timeScale(postTime);
        })
        .attr('y', d => userScale(d.push_userid))
        .attr('width', 2)
        .attr('height', userScale.bandwidth())
        .style('fill', d => commentTypeColor(d.push_tag))
        .on('mouseover', d => mouseover(data[i], d))
        .on('mouseout', mouseout);
    }
  }

  fixedSvg.append('g')
    .attr('class', 'yAxis')
    .call(d3.axisLeft(userScale))
    .attr('stroke-width', '0.5px');

  fixedSvg.append('g')
    .attr('class', 'xAxis')
    .call(d3.axisTop(timeScale)
      .ticks(d3.timeDay.every(1))
      .tickFormat(d3.timeFormat('%m/%d'))
      .tickSizeInner([20]));

  fixedSvg.selectAll('path').remove();

  // fixedSvg.append('g')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(10, 100)';
  //     return `translate(10, ${userOffset * gridSize + 100})`;
  //   })
  //   .append('text')
  //   .text(userListByReplyCountPerHours[i].id);

  // fixedSvg.append('g')
  //   .attr('class', 'yAxis')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(200, 100)';
  //     return `translate(200, ${userOffset * gridSize + 100})`;
  //   })
  //   .call(d3.axisLeft(y).tickSize(0));
  // fixedSvg.append('g')
  //   .attr('class', 'xAxis')
  //   .attr('transform', () => {
  //     if (i === 0) return 'translate(200, 100)';
  //     return `translate(200, ${userOffset * gridSize + 100})`;
  //   })
  //   .call(d3.axisTop(x).tickSize(0));
  // fixedSvg.selectAll('.yAxis')
  //   .selectAll('.tick')
  //   .selectAll('text')
  //   .style('color', (d) => {
  //     const date = new Date(`${new Date(begin).getFullYear()}/${d}`);
  //     if (date.getDay() > 0 && date.getDay() < 6) return 'black';
  //     return 'lightgray';
  //   });
  // fixedSvg.selectAll('.xAxis')
  //   .selectAll('.tick')
  //   .selectAll('text')
  //   .style('color', (d) => {
  //     if (d >= 8 && d <= 18) return 'black';
  //     return 'lightgray';
  //   });
  // }
  function computeUserListByReplyCountPerHours(d, u) {
    const userList = [];
    u.forEach((e) => {
      userList.push({ id: e, time: [] });
    });
    d.forEach((article) => {
      article.messages.forEach((mes) => {
        const userIndex = userList.findIndex(e => e.id === mes.push_userid);
        if (userIndex !== -1) {
          // console.log(userIndex);
          const date = new Date(mes.push_ipdatetime).getDate();
          const month = new Date(mes.push_ipdatetime).getMonth();
          const hours = new Date(mes.push_ipdatetime).getHours();
          const pushTime = `${month}/${date}/${hours}`;
          const timeIndex = userList[userIndex].time.findIndex(e => e.pushTime === pushTime);
          if (timeIndex !== -1) {
            userList[userIndex].time[timeIndex].reply.push(mes);
          } else {
            userList[userIndex].time.push({
              pushTime,
              month,
              hours,
              date,
              reply: [mes],
            });
          }
        }
      });
    });
    // console.log(userList);
    userList.forEach((e) => {
      if (!e.time[0]) e.totalDate = 0;
      else {
        const earliestDate = new Date(`${e.time[0].month}/${e.time[0].date}`);
        const latestDate = new Date(`${e.time[e.time.length - 1].month}/${e.time[e.time.length - 1].date}`);
        const diffTime = Math.abs(latestDate - earliestDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        e.totalDate = diffDays;
      }
    });
    return userList;
  }
  function oneToNArray(n) {
    const arr = [];
    for (let i = 0; i < n; i += 1) {
      arr.push(i);
    }
    return arr;
  }
  function getYDomain(be, en) {
    const beginDate = new Date(be);
    const endDate = new Date(en);
    // console.log(beginDate, endDate);
    const diffTime = Math.abs(endDate - beginDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const month = beginDate.getMonth();
    const date = beginDate.getDate();
    const arr = [];
    arr.push(`${beginDate.getMonth() + 1}/${beginDate.getDate()}`);
    for (let i = 0; i < diffDays + 3; i += 1) {
      const tempDate = new Date(beginDate.setDate(beginDate.getDate() + 1));
      // console.log(tempDate);
      arr.push(`${tempDate.getMonth() + 1}/${tempDate.getDate()}`);
    }
    return arr;
  }
  function getXScale() {
    const totalMinutes = 60 * 24;
    return d3.scaleTime().domain([0, totalMinutes]).range([100, 1000]);
  }
  function dateFormat(mes) {
    let dat = '';
    const splitedDate = mes.push_ipdatetime.split(' ');
    if (splitedDate.length === 3) {
      dat = dat.concat('', splitedDate[1]);
      dat = dat.concat(' ', splitedDate[2]);
      return dat;
    }
    return mes.push_ipdatetime;
  }
  function commentTypeColor(tag) {
    switch (tag) {
      case '推':
        return color[4];
      case '噓':
        return color[2];
      case '→':
        return color[5];
      default:
        return 'black';
    }
  }
  function update(date1, date2) {
    const updateXScale = d3.scaleTime().domain([new Date(date1), new Date(date2)]).range([0, 500]);
    const updateYScale = d3.scaleBand().domain(user).range([0, userScaleRange]);
    if (original_date1 < new Date(date1) || original_date2 > new Date(date2)) {
      filteredArticles.forEach((art) => {
        const article_id = art.article_id.replace(/\./gi, '');
        fixedSvg.selectAll(`.articleID_${article_id}`)
          .each((d, index, nodes) => {
            if (d3.select(nodes[index]).attr('class')[0] === 'p') {
              // article pointers
              if (new Date(art.date) > new Date(date1) && new Date(art.date) < new Date(date2)) {
                d3.select(nodes[index])
                  .attr('visibility', 'visible')
                  .selectAll('rect')
                  .attr('x', _d => updateXScale(new Date(_d.date)))
                  .attr('opacity', _d => (updateXScale(new Date(_d.date)) < 500 && updateXScale(new Date(_d.date)) > 0 ? 1 : 0));
                d3.select(nodes[index])
                  .selectAll('circle')
                  .attr('cx', _d => updateXScale(new Date(_d.date)) + 1)
                  .attr('opacity', _d => (updateXScale(new Date(_d.date)) < 500 && updateXScale(new Date(_d.date)) > 0 ? 1 : 0));
              } else {
                d3.select(nodes[index])
                  .attr('visibility', 'hidden');
              }
            } else {
              // user activities
              const postYear = new Date(art.date).getFullYear();
              const beginDateMinusTwo = new Date(date1);
              beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
              if (new Date(art.date) > beginDateMinusTwo && new Date(art.date) < new Date(date2)) {
                d3.select(nodes[index])
                  .attr('visibility', 'visible')
                  .selectAll('rect')
                  .attr('x', (e, i) => {
                    // const date = dateFormat(e);
                    // const commentTime = new Date(new Date(date).setFullYear(postYear));
                    // return updateXScale(commentTime);
                    const postDate = new Date(art.date);
                    return updateXScale(postDate);
                  })
                  .attr('opacity', (e, i) => {
                    // const date = dateFormat(e);
                    // const commentTime = new Date(new Date(date).setFullYear(postYear));
                    // return updateXScale(commentTime) < 500 && updateXScale(commentTime) > 0 ? 1 : 0;
                    const postDate = new Date(art.date);
                    return updateXScale(postDate) < 500 && updateXScale(postDate) > 0 ? 1 : 0;
                  });
              } else {
                d3.select(nodes[index])
                  .attr('visibility', 'hidden');
              }
            }
          });
      });
    } else {
      // article pointers
      fixedSvg.selectAll('.pointer')
        .each((d, index, nodes) => {
          const article_id = d3.select(nodes[index]).attr('class').slice(18);
          const article = data.find(e => e.article_id.replace(/\./gi, '') === article_id);
          if (new Date(article.date) > new Date(date1) && new Date(article.date) < new Date(date2)) {
            d3.select(nodes[index])
              .attr('visibility', 'visible')
              .selectAll('rect')
              .attr('x', _d => updateXScale(new Date(_d.date)))
              .attr('opacity', _d => (updateXScale(new Date(_d.date)) < 500 && updateXScale(new Date(_d.date)) > 0 ? 1 : 0));
            d3.select(nodes[index])
              .selectAll('circle')
              .attr('cx', _d => updateXScale(new Date(_d.date)) + 1)
              .attr('opacity', _d => (updateXScale(new Date(_d.date)) < 500 && updateXScale(new Date(_d.date)) > 0 ? 1 : 0));
          } else {
            d3.select(nodes[index])
              .attr('visibility', 'hidden');
          }
        });
      // user activities
      fixedSvg.selectAll('.article')
        .each((d, index, nodes) => {
          const article_id = d3.select(nodes[index]).attr('class').slice(18);
          const article = data.find(e => e.article_id.replace(/\./gi, '') === article_id);
          const postYear = new Date(article.date).getFullYear();
          const beginDateMinusTwo = new Date(date1);
          beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
          if (new Date(article.date) > beginDateMinusTwo && new Date(article.date) < new Date(date2)) {
            d3.select(nodes[index])
              .attr('visibility', 'visible')
              .selectAll('rect')
              .attr('x', (_d, _index) => {
                // const date = dateFormat(_d);
                // const commentTime = new Date(new Date(date).setFullYear(postYear));
                // return updateXScale(commentTime);
                const postDate = new Date(article.date);
                return updateXScale(postDate);
              })
              .attr('opacity', (_d, _index) => {
                // const date = dateFormat(_d);
                // const commentTime = new Date(new Date(date).setFullYear(postYear));
                // return updateXScale(commentTime) < 500 && updateXScale(commentTime) > 0 ? 1 : 0;
                const postDate = new Date(article.date);
                return updateXScale(postDate) < 500 && updateXScale(postDate) > 0 ? 1 : 0;
              });
          } else {
            d3.select(nodes[index])
              .attr('visibility', 'hidden');
          }
        });
    }

    // // article pointers
    // fixedSvg.selectAll('.pointer')
    //   .each((d, index, nodes) => {
    //     const article_id = d3.select(nodes[index]).attr('class').slice(8);
    //     const article = data.find(e => e.article_id.replace(/\./gi, '') === article_id);
    //     if (new Date(article.date) > new Date(date1) && new Date(article.date) < new Date(date2)) {
    //       d3.select(nodes[index])
    //         .attr('visibility', 'visible')
    //         .selectAll('rect')
    //         .attr('x', _d => updateXScale(new Date(_d.date)))
    //         .attr('opacity', _d => (updateXScale(new Date(_d.date)) < 500 && updateXScale(new Date(_d.date)) > 0 ? 1 : 0));
    //     } else {
    //       d3.select(nodes[index])
    //         .attr('visibility', 'hidden');
    //     }
    //   });
    // // user activities
    // fixedSvg.selectAll('.article')
    //   .each((d, index, nodes) => {
    //     const article_id = d3.select(nodes[index]).attr('class').slice(8);
    //     const article = data.find(e => e.article_id.replace(/\./gi, '') === article_id);
    //     const postYear = new Date(article.date).getFullYear();
    //     const beginDateMinusTwo = new Date(date1);
    //     beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
    //     if (new Date(article.date) > beginDateMinusTwo && new Date(article.date) < new Date(date2)) {
    //       d3.select(nodes[index])
    //         .attr('visibility', 'visible')
    //         .selectAll('rect')
    //         .attr('x', (_d, _index) => {
    //           const date = dateFormat(_d);
    //           const commentTime = new Date(new Date(date).setFullYear(postYear));
    //           return updateXScale(commentTime);
    //         })
    //         .attr('opacity', (_d, _index) => {
    //           const date = dateFormat(_d);
    //           const commentTime = new Date(new Date(date).setFullYear(postYear));
    //           return updateXScale(commentTime) < 500 && updateXScale(commentTime) > 0 ? 1 : 0;
    //         });
    //     } else {
    //       d3.select(nodes[index])
    //         .attr('visibility', 'hidden');
    //     }
    //   });


    filteredArticles = data.filter((e) => {
      const beginDateMinusTwo = new Date(date1);
      beginDateMinusTwo.setDate(beginDateMinusTwo.getDate() - 2);
      return new Date(beginDateMinusTwo) < new Date(e.date) && new Date(date2) > new Date(e.date);
    });

    fixedSvg.select('.yAxis')
      .call(d3.axisLeft(updateYScale))
      .attr('stroke-width', '0.5px');
    const aDay = 60 * 60 * 24 * 1000;
    if ((date2 - date1) / aDay <= 1) {
      fixedSvg.select('.xAxis')
        .call(d3.axisTop(updateXScale).tickFormat(d3.timeFormat('%H:%M')).tickSizeInner([20]));
    } else if ((date2 - date1) / aDay < 5) {
      fixedSvg.select('.xAxis')
        .call(d3.axisTop(updateXScale).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat('%m/%d %H:%M')).tickSizeInner([20]));
    } else if ((date2 - date1) / aDay < 15) {
      fixedSvg.select('.xAxis')
        .call(d3.axisTop(updateXScale).ticks(d3.timeDay.every(3)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([20]));
    } else if ((date2 - date1) / aDay < 30) {
      fixedSvg.select('.xAxis')
        .call(d3.axisTop(updateXScale).ticks(d3.timeDay.every(5)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([20]));
    } else if ((date2 - date1) / aDay < 60) {
      fixedSvg.select('.xAxis')
        .call(d3.axisTop(updateXScale).ticks(d3.timeDay.every(10)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([20]));
    } else {
      fixedSvg.select('.xAxis')
        .call(d3.axisTop(updateXScale).ticks(d3.timeDay.every(1)).tickFormat(d3.timeFormat('%m/%d')).tickSizeInner([20]));
    }
    fixedSvg.selectAll('path').remove();
  }
}

export { userDailyActivity };
